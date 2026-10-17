# Instrucciones para Configurar la Edge Function

## 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

## 2. Iniciar sesión en Supabase

```bash
supabase login
```

## 3. Vincular tu proyecto

```bash
cd c:\Users\RYZEN 3\Desktop\TEST3
supabase link --project-ref TU_PROJECT_REF
```

**Nota**: Encuentra tu `PROJECT_REF` en el dashboard de Supabase (URL: `https://app.supabase.com/project/[PROJECT_REF]`)

### AWS Rekognition Credentials (KYC & Biometría)

Ejecuta este comando para configurar los secretos de AWS requeridos por las Edge Functions:

```bash
supabase secrets set AWS_REGION=us-east-1 AWS_ACCESS_KEY_ID=TU_AWS_KEY AWS_SECRET_ACCESS_KEY=TU_AWS_SECRET
```

## 5. Desplegar la Edge Function

```bash
supabase functions deploy verify-kyc
```

## 6. Verificar que se desplegó correctamente

Ve a tu dashboard de Supabase:
- **Edge Functions** → Deberías ver `verify-kyc` listada
- Click en la función para ver los logs

## 7. Obtener la URL de la función

La URL será algo como:
```
https://[TU_PROJECT_REF].supabase.co/functions/v1/verify-kyc
```

## 8. Actualizar KYCScreen.tsx

Reemplaza el comentario `// TODO: Aquí llamaremos a la Edge Function` con:

```typescript
// Llamar a Edge Function para verificación
const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-kyc', {
    body: {
        user_id: user?.id,
        front_id_url: frontUrl,
        back_id_url: backUrl,
        selfie_url: selfie
    }
});

if (verifyError) {
    console.error('Verification error:', verifyError);
    Alert.alert('Error', 'No se pudo verificar tu identidad.');
    return;
}

const { status, score } = verifyData;

if (status === 'approved') {
    Alert.alert(
        '¡Verificación Exitosa!',
        `Tu identidad fue verificada con un ${score}% de confianza.`,
        [{ text: 'Continuar', onPress: () => setHasCompletedKyc(true) }]
    );
} else if (status === 'manual_review') {
    Alert.alert(
        'Revisión Manual',
        'Tu verificación requiere revisión manual. Te notificaremos pronto.',
        [{ text: 'OK', onPress: () => setHasCompletedKyc(true) }]
    );
} else {
    Alert.alert(
        'Verificación Rechazada',
        'No pudimos verificar tu identidad. Por favor intenta de nuevo con fotos más claras.',
        [{ text: 'Reintentar', onPress: () => {
            setStep(1);
            setFrontIdUrl(null);
            setBackIdUrl(null);
            setSelfieUrl(null);
        }}]
    );
}
```

## Notas Importantes

- **Seguridad**: Las credenciales de AWS Rekognition están guardadas como secrets en Supabase, no en el código
- **Testing**: Puedes probar la función localmente con `supabase functions serve verify-kyc`
