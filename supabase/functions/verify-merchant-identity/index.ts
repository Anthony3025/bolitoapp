import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
    RekognitionClient,
    CompareFacesCommand,
    DetectTextCommand
} from "npm:@aws-sdk/client-rekognition@3.451.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const payload = await req.json()
        const { user_id, selfie_url, id_front_url, id_back_url } = payload

        console.log(`[MERCHANT-VERIFY] Iniciando para User: ${user_id}`)

        if (!user_id || !selfie_url || !id_front_url || !id_back_url) {
            throw new Error("Faltan imágenes requeridas (Selfie, CI Anverso, CI Reverso) o user_id")
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Obtener nombre registrado del perfil para cruce OCR
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user_id)
            .single()

        if (profileError || !profile) {
            console.error('Error perfil:', profileError)
            throw new Error('No se pudo obtener el perfil del usuario para validación.')
        }
        const registeredName = profile.full_name || ''
        console.log(`[MERCHANT-VERIFY] Nombre registrado: "${registeredName}"`)

        // Configuración AWS
        const awsRegion = Deno.env.get('AWS_REGION')
        const awsAccessKey = Deno.env.get('AWS_ACCESS_KEY_ID')
        const awsSecretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')

        if (!awsRegion || !awsAccessKey || !awsSecretKey) {
            throw new Error('Faltan credenciales de AWS en Supabase Secrets')
        }

        const rekognitionClient = new RekognitionClient({
            region: awsRegion,
            credentials: {
                accessKeyId: awsAccessKey,
                secretAccessKey: awsSecretKey,
            }
        })

        // Helper descarga buffer
        const downloadImageAsBuffer = async (url: string) => {
            console.log(`Descargando: ${url}`)
            const resp = await fetch(url)
            if (!resp.ok) throw new Error(`No se pudo descargar imagen: ${url}`)
            const blob = await resp.blob()
            const arrayBuffer = await blob.arrayBuffer()
            return new Uint8Array(arrayBuffer)
        }

        const [selfieBuffer, frontBuffer] = await Promise.all([
            downloadImageAsBuffer(selfie_url),
            downloadImageAsBuffer(id_front_url)
        ])

        console.log('[MERCHANT-VERIFY] Imágenes descargadas. Iniciando Rekognition...')

        const [compareResponse, textResponse] = await Promise.all([
            rekognitionClient.send(new CompareFacesCommand({
                SourceImage: { Bytes: selfieBuffer },
                TargetImage: { Bytes: frontBuffer },
                SimilarityThreshold: 80,
            })),
            rekognitionClient.send(new DetectTextCommand({
                Image: { Bytes: frontBuffer }
            }))
        ])

        const faceMatch = compareResponse.FaceMatches?.[0]
        const similarity = faceMatch?.Similarity || 0
        console.log(`[MERCHANT-VERIFY] Similitud Facial: ${similarity.toFixed(2)}%`)

        const detectedText = textResponse.TextDetections?.map(t => t.DetectedText).join(' ') || ''
        console.log(`[MERCHANT-VERIFY] Texto OCR (Extracto): ${detectedText.substring(0, 50)}...`)

        let status = 'approved'
        let reason = 'Identidad verificada exitosamente.'

        if (similarity < 80) {
            status = 'rejected'
            reason = 'El rostro de la selfie no coincide con el del carnet.'
        }

        if (status === 'approved' && registeredName) {
            const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, "")
            const normRegistered = normalize(registeredName)
            const normOCR = normalize(detectedText)
            const nameParts = normRegistered.split(' ').filter(part => part.length > 3)
            const matchCount = nameParts.filter(part => normOCR.includes(part)).length

            if (nameParts.length > 0 && matchCount === 0) {
                status = 'rejected'
                reason = `El nombre registrado (${registeredName}) no aparece en el documento.`
            }
        }

        await supabase.from('verification_logs').insert({
            user_id,
            status: status === 'approved' ? 'success' : 'failed',
            details: {
                provider: 'aws_rekognition',
                similarity,
                reason,
                ocr_match: status === 'approved'
            }
        })

        return new Response(
            JSON.stringify({ status, reason, similarity }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[MERCHANT-VERIFY] Error:', error)
        return new Response(
            JSON.stringify({ status: 'rejected', reason: 'Error interno de validación.', debug: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
