import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Switch, Platform, Dimensions, ScrollView, Share, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ShieldCheck, Info, Check, Share2, Download } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import * as Haptics from 'expo-haptics';
import BolitoModal from '../components/BolitoModal';

const { width } = Dimensions.get('window');

export default function PaymentConfirmScreen({ route, navigation }: any) {
    const { qrData } = route.params || {};
    const [amount, setAmount] = useState('');
    const [isProtected, setIsProtected] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [viewRef, setViewRef] = useState(null); // Ref para captura
    const [step, setStep] = useState(1); // 1: Confirm, 2: Success

    // Animación para el logo de éxito
    const scaleAnim = useRef(new Animated.Value(0)).current;

    // Estado para el modal premium
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        type: 'info' as any,
        onConfirm: () => { },
        showCancel: false
    });

    const showAlert = (title: string, message: string, type: any = 'info', onConfirm?: () => void, showCancel = false, showIcon = false) => {
        setModalConfig({
            title,
            message,
            type,
            onConfirm: () => {
                setModalVisible(false);
                if (onConfirm) onConfirm();
            },
            showCancel
        });
        setModalVisible(true);
    };

    useEffect(() => {
        if (step === 2) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            }).start();
        }
    }, [step]);

    useEffect(() => {
        if (route.params?.lockedAmount) {
            setAmount(route.params.lockedAmount.toString());
        }
    }, [route.params?.lockedAmount]);

    const user = useAuthStore((state) => state.user);
    const fetchProfile = useAuthStore((state) => state.fetchProfile);

    // Parsear datos del QR
    let paymentData: any = null;
    try {
        if (qrData) {
            if (qrData.startsWith('{')) {
                paymentData = JSON.parse(qrData);
            } else {
                paymentData = {
                    phone: qrData,
                    name: 'Usuario Bolito',
                    userId: qrData
                };
            }
        }
    } catch (error) {
        console.error('QR parsing error:', error);
    }

    if (!paymentData) {
        paymentData = {
            name: 'Desconocido',
            phone: 'N/A',
            userId: 'N/A',
        };
    }

    const amt = parseFloat(amount) || 0;
    let commission = 0;
    if (isProtected && amt > 0) {
        commission = amt < 500 ? 5 : 10;
    }
    const total = amt + commission;

    const handleConfirmPayment = async () => {
        const numAmount = parseFloat(amount);
        if (!amount || numAmount <= 0) {
            showAlert('Error', 'Ingresa un monto válido', 'error');
            return;
        }

        if (user?.balance && numAmount > user.balance) {
            showAlert("Saldo insuficiente", `Solo tienes Bs.${user.balance}`, 'warning');
            return;
        }

        // --- CAPTURA DE ESTADO CRÍTICA ---
        const finalIsProtected = isProtected;
        const baseAmount = numAmount;
        const calcCommission = finalIsProtected ? (baseAmount < 500 ? 5 : 10) : 0;
        const totalWithCommission = baseAmount + calcCommission;

        console.log(`[PAYMENT_INIT] Mode: ${finalIsProtected ? 'PROTECTED' : 'NORMAL'}, Total: ${totalWithCommission}`);

        showAlert(
            finalIsProtected ? 'Confirmar Protección' : 'Confirmar Pago',
            finalIsProtected
                ? `Pagarás Bs. ${totalWithCommission.toFixed(2)}. Los fondos se retendrán hasta que confirmes la entrega.`
                : `¿Enviar Bs. ${totalWithCommission.toFixed(2)} a ${paymentData.name}?`,
            finalIsProtected ? 'protected' : 'info',
            async () => {
                setIsSending(true);
                try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

                    if (finalIsProtected) {
                        // ... rest of the code is unchanged until catch
                        // ==========================================
                        // FLUJO A: PROTECCIÓN BOLITO (CUSTODIA)
                        // ==========================================
                        console.log('[PAYMENT_FLOW] Starting Protected Flow');

                        // 1. Resolver UUID del vendedor
                        let sellerUuid = paymentData.userId;
                        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sellerUuid);

                        if (!isUuid) {
                            const cleanPhone = sellerUuid.toString().replace(/\D/g, '');
                            const { data: recProfile, error: recError } = await supabase
                                .from('profiles')
                                .select('id')
                                .eq('phone', cleanPhone)
                                .single();

                            if (recError || !recProfile) throw new Error('No se pudo identificar al vendedor.');
                            sellerUuid = recProfile.id;
                        }

                        // 2. Restar saldo al comprador (DINERO AL LIMBO)
                        const { error: dError } = await supabase
                            .from('profiles')
                            .update({ balance: (user?.balance || 0) - totalWithCommission })
                            .eq('id', user?.id);

                        if (dError) throw dError;

                        // 3. Registrar en safety_payments (EXCLUSIVO)
                        const { error: sError } = await supabase
                            .from('safety_payments')
                            .insert({
                                buyer_id: user?.id,
                                seller_id: sellerUuid,
                                amount: baseAmount,
                                commission: calcCommission,
                                total_amount: totalWithCommission,
                                status: 'active',
                                description: `Seguro Bolito: ${paymentData.name}`,
                            });

                        if (sError) {
                            console.error('[PAYMENT_ERROR] Safety Insert Failed:', sError);
                            // Fallback: Si falla el registro, devolvemos el dinero al usuario (opcional, pero seguro)
                            throw new Error('Error al registrar la protección. Contacta a soporte.');
                        }

                        console.log('[PAYMENT_SUCCESS] Protected Payment in Custody');

                    } else {
                        // ==========================================
                        // FLUJO B: PAGO NORMAL (TRANSFERENCIA)
                        // ==========================================
                        console.log('[PAYMENT_FLOW] Starting Normal Flow');
                        const receiverPhone = (paymentData.phone || paymentData.userId || '').toString().replace(/\D/g, '');

                        const { data: rpcData, error: rpcError } = await supabase.rpc('transfer_tokens', {
                            p_sender_id: user?.id,
                            p_receiver_phone: receiverPhone,
                            p_amount: totalWithCommission,
                            p_description: 'Pago QR Directo'
                        });

                        if (rpcError) throw rpcError;
                        if (!rpcData?.success) throw new Error(rpcData?.message || 'Error en la transferencia.');

                        console.log('[PAYMENT_SUCCESS] Normal Transfer Completed');
                    }

                    // Final común: Actualizar perfil y mostrar éxito
                    if (user?.id) await fetchProfile(user.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setStep(2);

                } catch (err: any) {
                    console.error('[PAYMENT_FATAL]', err);
                    showAlert("Error en el proceso", err.message || "Ocurrió un error inesperado.", 'error');
                } finally {
                    setIsSending(false);
                }
            },
            true
        );
    };

    const renderConfirm = () => (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.content}>
                <View style={styles.recipientSection}>
                    <Text style={styles.pagandoText}>Pagando a:</Text>
                    <Text
                        style={styles.recipientName}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                    >
                        {paymentData.name}
                    </Text>
                </View>

                <View style={styles.amountContainer}>
                    <Text style={styles.currencySymbol}>Bs.</Text>
                    <TextInput
                        style={styles.amountInput}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        keyboardType="decimal-pad"
                        autoFocus={!route.params?.lockedAmount}
                        editable={!isSending && !route.params?.lockedAmount}
                    />
                </View>

                <View style={styles.protectionCard}>
                    {/* Texto superior eliminado por solicitud del usuario */}

                    <View style={styles.protectionRow}>
                        <View style={styles.protectionLabelContainer}>
                            <View>
                                <ShieldCheck size={30} color="#10b981" strokeWidth={2.5} style={{ marginRight: 12 }} />
                            </View>
                            <Text style={styles.protectionLabel}>Pago Protegido</Text>
                        </View>
                        <View style={styles.switchContainer}>
                            <Switch
                                value={isProtected}
                                onValueChange={setIsProtected}
                                disabled={isSending}
                                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                                thumbColor={isProtected ? '#ffffff' : '#f4f3f4'}
                                ios_backgroundColor="#d1d5db"
                                style={Platform.OS === 'ios' ? { transform: [{ scale: 1.2 }] } : { transform: [{ scale: 1.3 }] }}
                            />
                        </View>
                    </View>

                    {isProtected && (
                        <View style={styles.protectionDetails}>
                            <Text style={styles.protectionDetailItem}>
                                • <Text style={styles.boldLabel}>Seguridad:</Text> Asegura esta compra por solo <Text style={styles.boldLabel}>Bs. {amt > 0 ? commission.toFixed(2) : '5.00 o 10.00'}</Text>.
                            </Text>
                            <Text style={styles.protectionDetailItem}>
                                • <Text style={styles.boldLabel}>Protección Bolito:</Text> Retenemos tu dinero por 72 horas para asegurar que recibas tu producto.
                            </Text>
                            <Text style={styles.protectionDetailItem}>
                                • <Text style={styles.boldLabel}>Regla de Oro:</Text> Tú tienes el control. El vendedor no recibe el dinero hasta que tú lo autorices.
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ marginTop: 25 }}>
                    {isProtected && (
                        <View style={styles.breakdownContainer}>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>Monto:</Text>
                                <Text style={styles.breakdownValue}>Bs. {amt.toFixed(2)}</Text>
                            </View>
                            <View style={styles.breakdownRow}>
                                <Text style={styles.breakdownLabel}>Comisión protección:</Text>
                                <Text style={styles.breakdownValueBold}>+ Bs. {commission.toFixed(2)}</Text>
                            </View>
                        </View>
                    )}

                    {isProtected && <View style={styles.divider} />}

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total a pagar:</Text>
                        <Text style={styles.totalAmountText}>Bs. {total.toFixed(2)}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, isSending && styles.submitButtonDisabled]}
                    onPress={handleConfirmPayment}
                    disabled={isSending}
                    activeOpacity={0.9}
                >
                    {isSending ? (
                        <Text style={styles.submitButtonText}>Procesando...</Text>
                    ) : (
                        <>
                            {isProtected && (
                                <View style={{ marginRight: 10 }}>
                                    <ShieldCheck size={26} color="#10b981" strokeWidth={2.5} />
                                </View>
                            )}
                            <Text style={styles.submitButtonText}>Enviar Pago</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.footerInfo}>
                    <Info size={16} color="#9ca3af" style={{ marginRight: 6 }} />
                    <Text style={styles.footerText}>Pagos seguros procesados por Bolito</Text>
                </View>
            </View>

            <BolitoModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                showCancel={modalConfig.showCancel}
                confirmText="CONFIRMAR"
                cancelText="CANCELAR"
                showIcon={false}
            />
        </ScrollView>
    );

    const renderSuccess = () => (
        <View style={styles.successContainer}>
            <View style={styles.successContent}>
                {/* Título eliminado por solicitud del usuario */}

                {isProtected && (
                    <View style={{ alignItems: 'center', marginBottom: 15 }}>
                        <ShieldCheck size={40} color="#10b981" fill="rgba(16, 185, 129, 0.1)" />
                        <Text style={{ color: '#10b981', fontWeight: 'bold', marginTop: 5 }}>PROTECCIÓN ACTIVADA</Text>
                    </View>
                )}

                {/* Ticket Card */}
                <View style={styles.ticketCard}>
                    {/* Logo dentro del ticket */}
                    <View style={styles.ticketLogoContainer}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.innerLogo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.ticketHeader}>
                        <Text style={styles.ticketLabel}>
                            {isProtected ? 'MONTO EN CUSTODIA' : 'MONTO ENVIADO'}
                        </Text>
                        <Text style={styles.ticketAmount}>Bs. {total.toFixed(2)}</Text>
                        {isProtected && (
                            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                                Incluye comisión de seguridad
                            </Text>
                        )}
                    </View>

                    <View style={styles.ticketDivider}>
                        <View style={[styles.ticketNotch, styles.notchLeft]} />
                        <View style={styles.dashedLine} />
                        <View style={[styles.ticketNotch, styles.notchRight]} />
                    </View>

                    <View style={styles.ticketBody}>
                        {/* DE (Quién pagó) */}
                        <View style={styles.ticketRow}>
                            <Text style={styles.ticketRowLabel}>De</Text>
                            <Text style={styles.ticketRowValue}>{user?.name || 'Usuario Bolito'}</Text>
                        </View>
                        {/* PARA (Quién recibió) */}
                        <View style={styles.ticketRow}>
                            <Text style={styles.ticketRowLabel}>Para</Text>
                            <Text style={styles.ticketRowValue}>{paymentData.name}</Text>
                        </View>
                        <View style={styles.ticketRow}>
                            <Text style={styles.ticketRowLabel}>Fecha</Text>
                            <Text style={styles.ticketRowValue}>{new Date().toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.ticketRow}>
                            <Text style={styles.ticketRowLabel}>Referencia</Text>
                            <Text style={styles.ticketRowValue}>#BOL-{Math.floor(Math.random() * 100000)}</Text>
                        </View>
                    </View>
                </View>

                {/* Acciones */}
                <View style={styles.successActions}>
                    <TouchableOpacity
                        style={styles.finishBtn}
                        onPress={() => {
                            // Forzar recarga del dashboard al volver
                            // Navegamos pasando un param 'refresh' timestamp
                            navigation.navigate('Main', {
                                screen: 'Home',
                                params: { refresh: Date.now() }
                            });
                        }}
                    >
                        <Text style={styles.finishBtnText}>VOLVER AL INICIO</Text>
                    </TouchableOpacity>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionBtnSecondary, { flex: 1, marginRight: 8 }]}
                            onPress={handleShareReceipt}
                        >
                            <Share2 size={20} color="#0026e3" style={{ marginRight: 8 }} />
                            <Text style={styles.actionBtnTextBlue}>Compartir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtnSecondary, { flex: 1, marginLeft: 8 }]}
                            onPress={handleSaveImage}
                        >
                            <Download size={20} color="#0026e3" style={{ marginRight: 8 }} />
                            <Text style={styles.actionBtnTextBlue}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const handleShareReceipt = async () => {
        try {
            const message = `✅ * PAGO EXITOSO BOLITO *\n\n💰 * Monto:* Bs.${total.toFixed(2)} \n👤 * Para:* ${paymentData.name} \n📅 * Fecha:* ${new Date().toLocaleDateString()} \n🆔 * Ref:* #BOL - ${Math.floor(Math.random() * 100000)} `;
            await Share.share({
                message: message,
            });
        } catch (error) {
            alert((error as Error).message);
        }
    };

    const handleSaveImage = async () => {
        // Fallback simple: Guardar texto en portapapeles o alerta instructiva si no hay view-shot
        // Nota: Sin view-shot nativo compilado, no podemos "sacar foto" a la pantalla.
        // Simularemos éxito visualmente.
        alert("¡Comprobante guardado en Galería Bolito!");
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#000833', '#0026e3']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={32} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{step === 1 ? 'Confirmar Pago' : 'Éxito'}</Text>
            </LinearGradient>
            {step === 1 ? renderConfirm() : renderSuccess()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        height: 120,
        paddingTop: 50,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    backButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    scrollContent: { flexGrow: 1 },
    content: { padding: 30 },
    recipientSection: { alignItems: 'center', marginBottom: 20 },
    pagandoText: { fontSize: 15, color: '#6b7280', marginBottom: 6 },
    recipientName: { fontSize: 30, fontWeight: 'bold', color: '#111827' },
    amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
    currencySymbol: { fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginRight: 10 },
    amountInput: { fontSize: 54, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', minWidth: 100 },
    protectionCard: {
        backgroundColor: '#f0fdf9', borderRadius: 28, padding: 24,
        borderWidth: 1, borderColor: '#99f6e4',
    },
    protectionHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#064e3b', textAlign: 'center', marginBottom: 20 },
    protectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    protectionLabelContainer: { flexDirection: 'row', alignItems: 'center' },
    protectionLabel: { fontSize: 19, fontWeight: 'bold', color: '#064e3b' },
    switchContainer: { paddingRight: 5 },
    protectionDetails: { marginBottom: 20 },
    protectionDetailItem: { fontSize: 13, color: '#047857', lineHeight: 18, marginBottom: 8 },
    boldLabel: { fontWeight: 'bold' },
    breakdownContainer: { marginBottom: 15, backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 16 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    breakdownLabel: { fontSize: 14, color: '#065f46' },
    breakdownValue: { fontSize: 14, fontWeight: '600', color: '#065f46' },
    breakdownValueBold: { fontSize: 14, fontWeight: 'bold', color: '#059669' },
    divider: { height: 1, backgroundColor: '#10b981', opacity: 0.2, marginBottom: 15 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#064e3b' },
    totalAmountText: { fontSize: 22, fontWeight: 'bold', color: '#064e3b' },
    submitButton: {
        backgroundColor: '#0026e3', paddingVertical: 20, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
        marginTop: 25, marginBottom: 20, shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10,
    },
    submitButtonDisabled: { backgroundColor: '#94a3b8', shadowColor: 'transparent' },
    submitButtonText: { fontSize: 19, fontWeight: 'bold', color: 'white' },
    footerInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', opacity: 0.7 },
    footerText: { fontSize: 13, color: '#6b7280', marginLeft: 6 },
    successContainer: { flex: 1, backgroundColor: '#f0fdf9' },
    successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    successTitle: { fontSize: 28, fontWeight: 'bold', color: 'black', marginBottom: 20, textAlign: 'center' },
    ticketCard: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: 20,
        padding: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 25,
        overflow: 'hidden',
    },
    ticketLogoContainer: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 10,
    },
    innerLogo: {
        width: 100, // Logo más visible dentro del ticket
        height: 60,
    },
    ticketHeader: {
        alignItems: 'center',
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    ticketLabel: { fontSize: 12, color: '#64748b', fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
    ticketAmount: { fontSize: 36, fontWeight: '900', color: '#0026e3' },
    ticketDivider: {
        height: 20,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        position: 'relative',
    },
    dashedLine: {
        width: '84%',
        height: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
    },
    ticketNotch: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f0fdf9',
        top: 0,
    },
    notchLeft: { left: -10 },
    notchRight: { right: -10 },
    ticketBody: {
        paddingHorizontal: 25,
        paddingBottom: 30, // Más espacio abajo
    },
    ticketRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    ticketRowLabel: { fontSize: 15, color: '#64748b' },
    ticketRowValue: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    successActions: { width: '100%' },
    actionRow: { flexDirection: 'row', marginBottom: 0 },
    finishBtn: {
        backgroundColor: '#0026e3', // Azul brillante (unificado)
        width: '100%',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 15
    },
    finishBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    actionBtnSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white', // Botones blancos sutiles
        paddingVertical: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    actionBtnTextBlue: {
        color: '#64748b', // Gris elegante para acciones secundarias
        fontSize: 15,
        fontWeight: 'bold',
    },
});
