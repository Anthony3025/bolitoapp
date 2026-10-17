-- =====================================================
-- SCRIPT DE CONFIGURACIÓN KYC PARA SUPABASE
-- =====================================================
-- Ejecutar este script completo en el SQL Editor de Supabase

-- 1. CREAR TABLA DE VERIFICACIONES KYC
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  
  -- URLs de las imágenes en Supabase Storage
  front_id_url TEXT,
  back_id_url TEXT,
  selfie_url TEXT,
  
  -- Datos extraídos del CI por OCR (JSON)
  extracted_data JSONB DEFAULT '{}'::jsonb,
  
  -- Score de coincidencia facial (0-100)
  face_match_score DECIMAL(5,2),
  
  -- Estado de la verificación
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'manual_review')),
  
  -- Razón del rechazo (si aplica)
  rejection_reason TEXT,
  
  -- Timestamps
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_created_at ON public.kyc_verifications(created_at DESC);

-- 3. ACTUALIZAR TABLA PROFILES
-- =====================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE;

-- 4. HABILITAR ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURIDAD PARA kyc_verifications
-- =====================================================

-- Los usuarios pueden ver solo sus propias verificaciones
DROP POLICY IF EXISTS "Users can view their own KYC" ON public.kyc_verifications;
CREATE POLICY "Users can view their own KYC"
  ON public.kyc_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear sus propias verificaciones
DROP POLICY IF EXISTS "Users can insert their own KYC" ON public.kyc_verifications;
CREATE POLICY "Users can insert their own KYC"
  ON public.kyc_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el sistema (service role) puede actualizar verificaciones
DROP POLICY IF EXISTS "Service role can update KYC" ON public.kyc_verifications;
CREATE POLICY "Service role can update KYC"
  ON public.kyc_verifications FOR UPDATE
  USING (true);

-- 6. CREAR STORAGE BUCKET PARA DOCUMENTOS KYC
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents', 
  'kyc-documents', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- 7. POLÍTICAS DE STORAGE
-- =====================================================

-- Los usuarios pueden subir sus propios documentos
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
CREATE POLICY "Users can upload their own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Los usuarios pueden ver sus propios documentos
DROP POLICY IF EXISTS "Users can view their own KYC documents" ON storage.objects;
CREATE POLICY "Users can view their own KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- El service role puede acceder a todos los documentos (para Edge Function)
DROP POLICY IF EXISTS "Service role can access all KYC documents" ON storage.objects;
CREATE POLICY "Service role can access all KYC documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents');

-- 8. FUNCIÓN PARA ACTUALIZAR TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_kyc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. TRIGGER PARA AUTO-ACTUALIZAR updated_at
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_kyc_timestamp ON public.kyc_verifications;
CREATE TRIGGER trigger_update_kyc_timestamp
  BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_kyc_updated_at();

-- 10. FUNCIÓN PARA SINCRONIZAR KYC CON PROFILES
-- =====================================================
CREATE OR REPLACE FUNCTION sync_kyc_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el KYC fue aprobado, actualizar el perfil
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.profiles
    SET 
      kyc_verified = true,
      kyc_verified_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  -- Si el KYC fue rechazado o está en revisión, marcar como no verificado
  IF NEW.status IN ('rejected', 'manual_review', 'pending') THEN
    UPDATE public.profiles
    SET kyc_verified = false
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. TRIGGER PARA SINCRONIZAR KYC → PROFILES
-- =====================================================
DROP TRIGGER IF EXISTS trigger_sync_kyc_to_profile ON public.kyc_verifications;
CREATE TRIGGER trigger_sync_kyc_to_profile
  AFTER INSERT OR UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION sync_kyc_to_profile();

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- Verifica que todo se creó correctamente:
SELECT 'Tables created' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'kyc_verifications';

SELECT 'Storage bucket created' as status;
SELECT name FROM storage.buckets WHERE id = 'kyc-documents';
