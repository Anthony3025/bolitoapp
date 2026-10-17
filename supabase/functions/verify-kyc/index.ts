import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
        const { user_id, front_id_url, selfie_url } = payload
        console.log(`[KYC] Iniciando verificación para usuario: ${user_id}`)

        if (!user_id || !front_id_url || !selfie_url) {
            console.error('[KYC] Faltan datos en el payload:', payload)
            throw new Error('Faltan datos (user_id, front_id_url o selfie_url)')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Obtener el nombre registrado del perfil del usuario
        console.log(`[KYC] Obteniendo perfil para: ${user_id}`)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user_id)
            .single()

        if (profileError || !profile) {
            console.error('[KYC] Error obteniendo perfil:', profileError)
            throw new Error('No se pudo encontrar el nombre registrado del usuario')
        }
        const registeredName = profile.full_name || ''
        console.log(`[KYC] Nombre registrado: "${registeredName}"`)

        // Configuración de AWS
        const awsRegion = Deno.env.get('AWS_REGION')
        const awsAccessKey = Deno.env.get('AWS_ACCESS_KEY_ID')
        const awsSecretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')

        if (!awsRegion || !awsAccessKey || !awsSecretKey) {
            console.error('[KYC] Faltan secretos de AWS en Supabase')
            throw new Error('Faltan configurar los secretos de AWS en Supabase')
        }

        const rekognitionClient = new RekognitionClient({
            region: awsRegion,
            credentials: {
                accessKeyId: awsAccessKey,
                secretAccessKey: awsSecretKey,
            }
        })

        const downloadImageAsBuffer = async (url: string) => {
            console.log(`[KYC] Intentando descargar: ${url}`)
            const parts = url.split('kyc-documents/')
            const path = parts.length > 1 ? parts[1].split('?')[0] : null // Limpiar query params si los hay

            if (!path) throw new Error(`URL de Storage inválida: ${url}`)

            const { data, error } = await supabase.storage.from('kyc-documents').download(path)
            if (error) {
                console.error(`[KYC] Error descargando ${path}:`, error.message)
                throw new Error(`Error descargando imagen: ${error.message}`)
            }

            const arrayBuffer = await data.arrayBuffer()
            return new Uint8Array(arrayBuffer)
        }

        console.log('[KYC] Descargando imágenes...')
        const [frontBuffer, selfieBuffer] = await Promise.all([
            downloadImageAsBuffer(front_id_url),
            downloadImageAsBuffer(selfie_url)
        ])
        console.log('[KYC] Imágenes descargadas con éxito')

        console.log('[KYC] Iniciando análisis AI en paralelo...')
        const [compareResponse, textResponse] = await Promise.all([
            rekognitionClient.send(new CompareFacesCommand({
                SourceImage: { Bytes: frontBuffer },
                TargetImage: { Bytes: selfieBuffer },
                SimilarityThreshold: 70,
            })),
            rekognitionClient.send(new DetectTextCommand({
                Image: { Bytes: frontBuffer }
            }))
        ])

        const faceMatch = compareResponse.FaceMatches?.[0]
        const similarity = faceMatch?.Similarity || 0
        console.log(`[KYC] Similitud: ${similarity}%`)

        const idText = textResponse.TextDetections?.map(t => t.DetectedText).join(' ') || ''
        console.log(`[KYC] Texto detectado (primeras 100 letras): ${idText.substring(0, 100)}`)

        let status = 'approved'
        let score = similarity
        let reason = ''

        // 2. Validación de Similitud Facial
        if (similarity === 0) {
            status = 'rejected'
            reason = 'No se detectó coincidencia de rostro.'
        } else if (similarity < 80) {
            status = 'rejected'
            reason = 'Similitud de rostro insuficiente.'
        }

        // 3. Validación de Legibilidad de Texto
        if (status === 'approved' && idText.length < 15) {
            status = 'rejected'
            reason = 'Documento no legible o incompleto.'
        }

        // 4. Validación de Nombre (SEGURIDAD)
        if (status === 'approved' && registeredName) {
            const normalize = (str: string) =>
                str.toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
                    .replace(/[^a-z0-9 ]/g, "");     // Solo letras, números y espacios

            const normalizedIDText = normalize(idText);
            const normalizedRegisteredName = normalize(registeredName);

            const nameParts = normalizedRegisteredName.split(' ').filter(p => p.length > 2);
            const nameMatches = nameParts.some(part => normalizedIDText.includes(part));

            if (!nameMatches) {
                console.log(`[KYC] SEGURIDAD: El nombre "${registeredName}" no coincide. Marcando como RECHAZADO.`);
                status = 'rejected'
                reason = 'Documento no coincide con los datos del perfil.'
            } else {
                console.log(`[KYC] Nombre verificado con éxito.`);
            }
        }

        console.log(`[KYC] Guardando resultado final: ${status}`)
        await supabase.from('kyc_verifications').update({
            status: status,
            face_match_score: score.toFixed(2),
            rejection_reason: reason,
            extracted_data: {
                raw_text: idText.substring(0, 1000),
                aws_details: compareResponse.FaceMatches?.[0],
                internal_audit: {
                    registered_name: registeredName,
                    name_match_fail: status === 'rejected' && reason.includes('perfil')
                }
            },
            verified_at: status === 'approved' ? new Date().toISOString() : null
        }).eq('user_id', user_id)

        if (status === 'approved') {
            await supabase.from('profiles').update({
                kyc_verified: true,
                kyc_verified_at: new Date().toISOString()
            }).eq('id', user_id)
        }

        console.log(`[KYC] Proceso completado. Resultado: ${status}`)

        // Respuesta Blindada: Mensaje genérico para cualquier fallo
        const publicReason = status === 'approved'
            ? 'Aprobado'
            : 'No se pudo verificar la identidad. Asegúrate de que las fotos sean claras, el documento sea el correcto y los datos coincidan con tu registro.';

        return new Response(
            JSON.stringify({
                success: true,
                status,
                score,
                reason: publicReason
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('[KYC] SERVER ERROR:', error.message)
        if (error.stack) console.error(error.stack)

        return new Response(
            JSON.stringify({ success: false, error: 'Error interno al procesar la verificación.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
