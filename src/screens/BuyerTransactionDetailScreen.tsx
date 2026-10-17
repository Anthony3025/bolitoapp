import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ShieldCheck, Clock, CheckCircle2, AlertTriangle, ShieldAlert, Bell } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import * as Haptics from 'expo-haptics';
import BolitoModal from '../components/BolitoModal';

export default function BuyerTransactionDetailScreen({ route, navigation }: any) {
    const { item } = route.params || { item: { title: 'Compra Gafas Sol', amount: '150.00', date: '10 Ene, 2026' } };
    const [status, setStatus] = useState<'CUSTODIA' | 'ENVIADO' | 'COMPLETADO' | 'MEDIACION'>(item.status === 'completed' ? 'COMPLETADO' : 'CUSTODIA');
    const [isNudged, setNudged] = useState(false);
    const [showMediationCard, setShowMediationCard] = useState(false);
    const [selectedReason, setSelectedReason] = React.useState<string | null>(null);
    const [timeLeft, setTimeLeft] = React.useState(72 * 3600 - 120); // Simulación: 72 horas menos 2 mins

    // Estado para el modal premium
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        type: 'info' as any,
        onConfirm: () => { },
        showCancel: false,
        confirmText: 'Entendido'
    });

    const showAlert = (title: string, message: string, type: any = 'info', onConfirm?: () => void, showCancel = false, confirmText = 'Continuar', showIcon = false) => {
        setModalConfig({
            title,
            message,
            type,
            onConfirm: () => {
                setModalVisible(false);
                if (onConfirm) onConfirm();
            },
            showCancel,
            confirmText
        });
        setModalVisible(true);
    };

    React.useEffect(() => {
        if (status !== 'CUSTODIA') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [status]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleConfirmReceipt = async () => {
        showAlert(
            'Confirmar Recepción',
            '¿Ya tienes el producto? Esto liberará el dinero al vendedor.',
            'protected',
            async () => {
                // ... logic
                try {
                    console.log('🛡️ Releasing payment via RPC for item:', item.id);

                    const { data, error } = await supabase.rpc('complete_protected_payment', {
                        p_safety_payment_id: item.id,
                        p_buyer_id: item.buyer_id,
                        p_seller_id: item.seller_id,
                        p_amount: item.amount,
                        p_total_amount: item.total_amount,
                        p_description: item.description || 'Pago Protegido Completado'
                    });

                    if (error) {
                        console.error('RPC Error:', error);
                        showAlert('Error', 'No se pudo comunicar con el servidor.', 'error');
                        return;
                    }

                    if (data?.success) {
                        setStatus('COMPLETADO');
                        showAlert('¡Éxito!', 'El dinero ha sido liberado al vendedor. Gracias por confiar en la Protección Bolito.', 'success', () => {
                            setTimeout(() => navigation.goBack(), 500);
                        });
                    } else {
                        console.error('Business logic error:', data?.message);
                        showAlert('Error', data?.message || 'No se pudo liberar el pago.', 'error');
                    }

                } catch (e) {
                    console.error('Unexpected error:', e);
                    showAlert('Error', 'Ocurrió un error inesperado.', 'error');
                }
            },
            true,
            'CONFIRMAR'
        );
    };

    const handleReportProblem = () => {
        setShowMediationCard(true);
    };

    const handleConfirmMediation = () => {
        setStatus('MEDIACION');
        setShowMediationCard(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <LinearGradient
                colors={['#000833', '#0026e3']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Transacción</Text>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 50 }}
            >
                {/* Main Card */}
                <View style={[styles.mainCard, status === 'MEDIACION' && { borderColor: '#ef4444', borderWidth: 1 }]}>
                    <View style={[
                        styles.badge,
                        status === 'COMPLETADO' && { backgroundColor: '#10b981' },
                        status === 'MEDIACION' && { backgroundColor: '#ef4444' }
                    ]}>
                        {status === 'CUSTODIA' && <Clock size={16} color="#10b981" style={{ marginRight: 6 }} />}
                        {status === 'COMPLETADO' && <CheckCircle2 size={16} color="white" style={{ marginRight: 6 }} />}
                        {status === 'MEDIACION' && <ShieldAlert size={16} color="white" style={{ marginRight: 6 }} />}

                        <Text style={[styles.badgeText, (status === 'COMPLETADO' || status === 'MEDIACION') && { color: 'white' }]}>
                            {status === 'CUSTODIA' && `PROTEGIDO | ${formatTime(timeLeft)}`}
                            {status === 'COMPLETADO' && 'COMPLETADO'}
                            {status === 'MEDIACION' && 'EN MEDIACIÓN'}
                        </Text>
                    </View>

                    <Text style={styles.mainAmount}>Bs. {item.amount}</Text>
                    <Text style={styles.mainSubtitle}>Pagado a <Text style={styles.boldText}>{item.title}</Text></Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>

                {/* Status Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Estado del envío</Text>
                </View>

                <View style={styles.statusRow}>
                    <View style={[styles.iconCircle, status === 'MEDIACION' && { backgroundColor: '#fee2e2' }]}>
                        {status === 'MEDIACION' ? (
                            <ShieldAlert size={24} color="#ef4444" />
                        ) : (
                            <ShieldCheck size={24} color="#10b981" />
                        )}
                    </View>
                    <View style={styles.statusContent}>
                        <Text style={[styles.statusLabel, status === 'MEDIACION' && { color: '#ef4444' }]}>
                            {status === 'CUSTODIA' && 'Dinero Protegido'}
                            {status === 'COMPLETADO' && 'Fondos Liberados'}
                            {status === 'MEDIACION' && 'Transacción Retenida'}
                        </Text>
                        <Text style={styles.statusDescription}>
                            {status === 'CUSTODIA' && 'El vendedor no recibirá el dinero hasta que confirmes que tienes el producto en tus manos.'}
                            {status === 'COMPLETADO' && '¡Gracias por usar Pago Protegido! El dinero ya está en la cuenta del vendedor.'}
                            {status === 'MEDIACION' && 'Nuestro equipo de seguridad está revisando este caso. El dinero permanecerá bloqueado.'}
                        </Text>
                    </View>
                </View>

                {/* Important Box (Conditional) */}
                {status !== 'COMPLETADO' && (
                    <View style={[styles.importantBox, status === 'MEDIACION' && { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                        <Text style={[styles.importantText, status === 'MEDIACION' && { color: '#991b1b' }]}>
                            <Text style={styles.boldText}>IMPORTANTE:</Text> {status === 'MEDIACION'
                                ? 'La liberación automática ha sido suspendida mientras resolvemos el inconveniente.'
                                : 'Toma fotos, videos cortos y guarda el voucher o guía al recibir o abrir el producto. Son requisitos obligatorios para cualquier mediación.'}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                {status === 'CUSTODIA' && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            activeOpacity={0.9}
                            onPress={handleConfirmReceipt}
                        >
                            <CheckCircle2 size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.primaryButtonText}>Ya recibí el producto</Text>
                        </TouchableOpacity>

                        {!showMediationCard && status === 'CUSTODIA' && (
                            <TouchableOpacity
                                style={[styles.nudgeButton, isNudged && styles.nudgeButtonDisabled]}
                                onPress={() => {
                                    if (isNudged) return;
                                    setNudged(true);
                                    if (Platform.OS !== 'web') {
                                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    }
                                    Alert.alert('¡Recordatorio enviado! 🔔', 'El vendedor ha sido notificado de tu interés.');
                                }}
                                disabled={isNudged}
                            >
                                <Bell size={20} color={isNudged ? '#9ca3af' : '#d97706'} style={{ marginRight: 8 }} />
                                <Text style={[styles.nudgeButtonText, isNudged && styles.nudgeButtonTextDisabled]}>
                                    {isNudged ? 'Recordatorio Enviado' : 'Enviar Recordatorio 🔔'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {showMediationCard ? (
                            <View style={styles.mediationCard}>
                                <View style={styles.mediationHeader}>
                                    <AlertTriangle size={22} color="#ef4444" style={{ marginRight: 10 }} />
                                    <Text style={styles.mediationTitle}>Iniciar Mediación</Text>
                                </View>

                                <Text style={styles.reasonQuestion}>¿Cuál es el problema con tu compra?</Text>
                                <View style={styles.reasonContainer}>
                                    <TouchableOpacity
                                        style={[styles.reasonChip, selectedReason === 'no_recibi' && styles.reasonChipActive]}
                                        onPress={() => setSelectedReason('no_recibi')}
                                    >
                                        <Text style={[styles.reasonChipText, selectedReason === 'no_recibi' && styles.reasonChipTextActive]}>
                                            No recibí el producto
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.reasonChip, selectedReason === 'no_guia' && styles.reasonChipActive]}
                                        onPress={() => setSelectedReason('no_guia')}
                                    >
                                        <Text style={[styles.reasonChipText, selectedReason === 'no_guia' && styles.reasonChipTextActive]}>
                                            No me envió la guía o boucher
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.reasonChip, selectedReason === 'no_responde' && styles.reasonChipActive]}
                                        onPress={() => setSelectedReason('no_responde')}
                                    >
                                        <Text style={[styles.reasonChipText, selectedReason === 'no_responde' && styles.reasonChipTextActive]}>
                                            El vendedor no responde
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.mediationDivider} />

                                <View style={styles.mediationBullet}>
                                    <Text style={styles.bulletDot}>•</Text>
                                    <Text style={styles.bulletText}>Debes tener <Text style={styles.boldText}>pruebas claras</Text> (fotos, videos cortos, capturas de conversaciones, voucher o guía, etc).</Text>
                                </View>

                                <View style={styles.mediationBullet}>
                                    <Text style={styles.bulletDot}>•</Text>
                                    <Text style={styles.bulletText}>Debes haber intentado contactar al vendedor primero.</Text>
                                </View>

                                <View style={styles.mediationBullet}>
                                    <Text style={styles.bulletDot}>•</Text>
                                    <Text style={styles.bulletText}>La mediación es revisada por un especialista de Bolito.</Text>
                                </View>

                                <View style={styles.mediationActions}>
                                    <TouchableOpacity
                                        style={[styles.solicitarBtn, !selectedReason && { opacity: 0.5 }]}
                                        onPress={handleConfirmMediation}
                                        disabled={!selectedReason}
                                    >
                                        <Text style={styles.solicitarBtnText}>Solicitar Mediación</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.cancelarMedBtn}
                                        onPress={() => setShowMediationCard(false)}
                                    >
                                        <Text style={styles.cancelarMedBtnText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleReportProblem}
                            >
                                <AlertTriangle size={20} color="#6b7280" style={{ marginRight: 8 }} />
                                <Text style={styles.secondaryButtonText}>Tengo un problema</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {status === 'MEDIACION' && (
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: '#111827' }]}
                        onPress={() => showAlert('Soporte', 'Redirigiendo al chat con soporte...', 'info')}
                    >
                        <Text style={styles.primaryButtonText}>Hablar con un Agente</Text>
                    </TouchableOpacity>
                )}

                {/* Footer Info */}
                <View style={styles.footerBox}>
                    <Text style={styles.footerText}>
                        <Text style={styles.footerLink}>¿Cómo funciona?</Text> Si no confirmas en 72hs y no hay reclamos, el dinero se libera automáticamente.
                    </Text>
                </View>
            </ScrollView>

            <BolitoModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                showCancel={modalConfig.showCancel}
                confirmText={modalConfig.confirmText}
                cancelText="CANCELAR"
                showIcon={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        height: 120,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: -20,
        zIndex: 1,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    mainCard: {
        backgroundColor: 'white',
        borderRadius: 35,
        padding: 30,
        alignItems: 'center',
        marginTop: 40,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    nudgeBanner: {
        backgroundColor: '#fffbeb',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nudgeBannerText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#92400e',
        textAlign: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6f9f3',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#047857',
        letterSpacing: 0.5,
    },
    mainAmount: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
    },
    mainSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 5,
    },
    boldText: {
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    sectionHeader: {
        marginTop: 25,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e6f9f3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    statusContent: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    statusDescription: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
    importantBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 15,
        padding: 16,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    importantText: {
        fontSize: 12,
        color: '#1e3a8a',
        lineHeight: 18,
    },
    actions: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#0026e3',
        height: 65,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 6,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'white',
        height: 65,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    secondaryButtonText: {
        color: '#1f2937',
        fontSize: 17,
        fontWeight: 'bold',
    },
    mediationCard: {
        backgroundColor: '#fff1f2',
        borderRadius: 25,
        padding: 20,
        borderWidth: 1,
        borderColor: '#fecaca',
        marginTop: 10,
    },
    mediationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    mediationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#b91c1c',
    },
    reasonQuestion: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 5,
        marginBottom: 12,
    },
    reasonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    reasonChip: {
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    reasonChipActive: {
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
    },
    reasonChipText: {
        fontSize: 13,
        color: '#4b5563',
        fontWeight: '600',
    },
    reasonChipTextActive: {
        color: 'white',
    },
    mediationDivider: {
        height: 1,
        backgroundColor: '#fecaca',
        marginVertical: 15,
        opacity: 0.5,
    },
    mediationBullet: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingRight: 10,
    },
    bulletDot: {
        fontSize: 18,
        color: '#6b7280',
        marginRight: 8,
        lineHeight: 20,
    },
    bulletText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        flex: 1,
    },
    mediationActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    solicitarBtn: {
        flex: 1.5,
        backgroundColor: '#ef4444',
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    solicitarBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    cancelarMedBtn: {
        flex: 1,
        backgroundColor: '#fef2f2',
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    cancelarMedBtnText: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: 'bold',
    },
    footerBox: {
        marginTop: 30,
        paddingHorizontal: 15,
    },
    footerText: {
        fontSize: 12,
        color: '#2563eb',
        textAlign: 'center',
        lineHeight: 18,
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 12,
    },
    footerLink: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    nudgeButton: {
        backgroundColor: '#fffbeb',
        height: 65,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#fef3c7',
        marginTop: 5,
    },
    nudgeButtonDisabled: {
        backgroundColor: '#f3f4f6',
        borderColor: '#e5e7eb',
    },
    nudgeButtonText: {
        color: '#92400e',
        fontSize: 16,
        fontWeight: 'bold',
    },
    nudgeButtonTextDisabled: {
        color: '#9ca3af',
    },
});
