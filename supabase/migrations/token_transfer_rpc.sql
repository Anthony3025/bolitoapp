-- Función para transferencia de Bolitos entre usuarios (Atómica)
CREATE OR REPLACE FUNCTION transfer_tokens(
    p_sender_id UUID,
    p_receiver_phone TEXT,
    p_amount DECIMAL(12,2),
    p_description TEXT DEFAULT 'Transferencia de Bolitos'
) 
RETURNS JSON AS $$
DECLARE
    v_receiver_id UUID;
    v_sender_balance DECIMAL(12,2);
BEGIN
    -- 1. Buscar al receptor por su teléfono
    SELECT id INTO v_receiver_id FROM public.profiles WHERE phone = p_receiver_phone;
    
    IF v_receiver_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'El receptor no está registrado.');
    END IF;

    -- 2. No permitir auto-transferencias
    IF p_sender_id = v_receiver_id THEN
        RETURN json_build_object('success', false, 'message', 'No puedes enviarte bolitos a ti mismo.');
    END IF;

    -- 3. Verificar saldo del emisor
    SELECT balance INTO v_sender_balance FROM public.profiles WHERE id = p_sender_id FOR UPDATE;
    
    IF v_sender_balance < p_amount THEN
        RETURN json_build_object('success', false, 'message', 'Saldo insuficiente.');
    END IF;

    -- 4. Ejecutar el intercambio (Atómico)
    -- Restar al emisor
    UPDATE public.profiles SET balance = balance - p_amount WHERE id = p_sender_id;
    -- Sumar al receptor
    UPDATE public.profiles SET balance = balance + p_amount WHERE id = v_receiver_id;

    -- 5. Registrar transacciones (para ambos)
    -- Registro para el emisor (Egreso)
    INSERT INTO public.transactions (user_id, type, amount, status, description)
    VALUES (p_sender_id, 'transfer_out', -p_amount, 'completed', p_description || ' a ' || p_receiver_phone);

    -- Registro para el receptor (Ingreso)
    INSERT INTO public.transactions (user_id, type, amount, status, description)
    VALUES (v_receiver_id, 'transfer_in', p_amount, 'completed', p_description || ' de usuario emisor');

    RETURN json_build_object('success', true, 'message', 'Transferencia exitosa');

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Error interno: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
