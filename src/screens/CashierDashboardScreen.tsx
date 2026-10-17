import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    BackHandler,
    Image,
    Modal,
    Animated,
    ActivityIndicator,
    Switch,
    Alert,
    Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import {
    ArrowLeft,
    CheckCircle2,
    X,
    TrendingUp,
    TrendingDown,
    Delete,
    ShieldCheck,
    Power
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useCashierStore } from '../store/cashierStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

export default function CashierDashboardScreen() {
    const navigation = useNavigation<any>();
    const { setIsCashierMode, businessData } = useCashierStore();
    const user = useAuthStore((state) => state.user);

    // --- ESTADOS DE CONTROL ---
    const [isActive, setIsActive] = React.useState(true);
    const [isUpdatingVisibility, setIsUpdatingVisibility] = React.useState(false);
    const [services, setServices] = React.useState<string[]>(['DEPÓSITO', 'RETIRO']);
    const [otpCode, setOtpCode] = React.useState('');
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [showConfirmation, setShowConfirmation] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [transactionDetails, setTransactionDetails] = React.useState<any>(null);
    const [showKeypad, setShowKeypad] = React.useState(false);
    const [transactionHistory, setTransactionHistory] = React.useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = React.useState(false); // Evitar doble carga

    // --- ANIMACIONES PREMIUM ---
    const statusColorAnim = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;
    const pulseAnim = React.useRef(new Animated.Value(0)).current; // Para el aura del Orb
    const depositScale = React.useRef(new Animated.Value(1)).current;
    const retiroScale = React.useRef(new Animated.Value(1)).current;
    const slideAnim = React.useRef(new Animated.Value(500)).current;
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        loadPointStatus();
        loadTransactionHistory();
    }, []);

    // Pulse Animation for the Orb
    React.useEffect(() => {
        if (isActive) {
            pulseAnim.setValue(0);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(0);
        }
    }, [isActive]);

    React.useEffect(() => {
        Animated.timing(statusColorAnim, {
            toValue: isActive ? 1 : 0,
            duration: 400,
            useNativeDriver: false,
        }).start();
    }, [isActive]);

    // Handle Hardware Back Press
    React.useEffect(() => {
        const backAction = () => {
            if (showKeypad) {
                closeKeypad();
                return true;
            }
            navigation.navigate('Main');
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [navigation, showKeypad]);

    // Keypad Animations
    React.useEffect(() => {
        if (showKeypad) {
            slideAnim.setValue(500);
            fadeAnim.setValue(0);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
            ]).start();
        }
    }, [showKeypad]);

    const loadTransactionHistory = async () => {
        if (isLoadingHistory) return; // Si ya está cargando, salir
        setIsLoadingHistory(true);

        try {
            const { data, error } = await supabase
                .from('cashier_transactions')
                .select('*')
                .eq('cashier_id', user?.id)
                .eq('status', 'completed') // SOLO COMPLETADOS (Elimina fantasmas)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setTransactionHistory(data); // Reemplaza la lista (No acumula)
            }
        } catch (err) {
            console.error("Error loading history:", err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const loadPointStatus = async () => {
        try {
            const { data, error } = await supabase
                .from('cashier_points')
                .select('*')
                .eq('owner_id', user?.id)
                .single();

            if (data && !error) {
                setIsActive(data.is_active);
                setServices(data.services || ['DEPÓSITO', 'RETIRO']);
            }
        } catch (err) {
            console.log("Error loading point status:", err);
        }
    };

    const toggleVisibility = async (value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsUpdatingVisibility(true);
        try {
            const { error } = await supabase
                .from('cashier_points')
                .update({ is_active: value })
                .eq('owner_id', user?.id);

            if (!error) {
                setIsActive(value);
            } else {
                Alert.alert("Error", "No pudimos actualizar tu visibilidad.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdatingVisibility(false);
        }
    };

    const toggleService = async (service: string) => {
        const anim = service === 'DEPÓSITO' ? depositScale : retiroScale;
        Animated.sequence([
            Animated.timing(anim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
            Animated.spring(anim, { toValue: 1, friction: 3, useNativeDriver: true })
        ]).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newServices = services.includes(service)
            ? services.filter(s => s !== service)
            : [...services, service];

        if (newServices.length === 0) {
            Alert.alert("Aviso", "Debes ofrecer al menos un servicio.");
            return;
        }

        try {
            const { error } = await supabase
                .from('cashier_points')
                .update({ services: newServices })
                .eq('owner_id', user?.id);
            if (!error) setServices(newServices);
        } catch (err) {
            console.error(err);
        }
    };

    const handleNumberPress = (num: number) => {
        if (otpCode.length < 4) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const newCode = otpCode + num;
            setOtpCode(newCode);
            if (newCode.length === 4) {
                setTimeout(() => {
                    closeKeypad();
                    validateCode(newCode);
                }, 200);
            }
        }
    };

    const handleDelete = () => {
        if (otpCode.length > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setOtpCode(otpCode.slice(0, -1));
        }
    };

    const closeKeypad = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 500, duration: 200, useNativeDriver: true })
        ]).start(() => setShowKeypad(false));
    };

    const validateCode = async (code: string) => {
        setIsVerifying(true);
        try {
            const { data, error } = await supabase.rpc('validate_cashier_otp', {
                p_otp_code: code
            });

            if (error || !data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert("Código Inválido", data?.message || "No se encontró ninguna operación pendiente con ese código.");
                setOtpCode('');
                return;
            }

            setTransactionDetails({
                id: data.transaction_id,
                type: data.type,
                amount: data.amount,
                user: data.client_name,
                avatar: data.client_avatar,
                code: code
            });
            setShowConfirmation(true);
            playCashSound();
        } catch (err) {
            Alert.alert("Error", "Ocurrió un error al validar el código.");
        } finally {
            setIsVerifying(false);
        }
    };

    async function playCashSound() {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/sounds/transaction-swoosh.mp3'),
                { shouldPlay: true }
            );
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    }

    const confirmTransaction = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { data, error } = await supabase.rpc('process_cashier_transaction', {
                p_tx_id: transactionDetails.id
            });

            if (error || !data.success) {
                Alert.alert("Error", data?.message || "No se pudo procesar la transacción.");
                return;
            }

            setShowConfirmation(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
                setShowSuccess(true);
                loadTransactionHistory(); // Recargar historial real
            }, 300);
        } catch (err) {
            Alert.alert("Error", "Error de conexión al procesar.");
        }
    };

    // --- RENDER HELPERS ---
    const ConfirmationModal = () => (
        <Modal visible={showConfirmation} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.confirmationCard}>
                    <View style={styles.confirmationHeader}>
                        <ShieldCheck color="#3b82f6" size={24} />
                        <Text style={styles.confirmationTitle}>Validación Segura</Text>
                        <TouchableOpacity onPress={() => setShowConfirmation(false)}>
                            <X color="#64748b" size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.userInfoContainer}>
                        <Text style={styles.userName}>{transactionDetails?.user}</Text>
                        <Text style={styles.userRole}>USUARIO VERIFICADO</Text>
                    </View>

                    <View style={styles.transactionSummaryBox}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tipo de Transacción</Text>
                            <Text style={[styles.summaryValue, { color: transactionDetails?.type === 'RETIRO' ? '#3b82f6' : '#10b981' }]}>
                                {transactionDetails?.type}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Monto a procesar</Text>
                            <Text style={styles.amountValue}>Bs. {transactionDetails?.amount}</Text>
                        </View>
                    </View>

                    <View style={[styles.instructionBox, { borderColor: transactionDetails?.type === 'DEPÓSITO' ? '#10b98133' : '#3b82f633' }]}>
                        <Text style={[styles.instructionText, { color: transactionDetails?.type === 'DEPÓSITO' ? '#10b981' : '#3b82f6' }]}>
                            {transactionDetails?.type === 'DEPÓSITO'
                                ? '🚩 Recibe el efectivo ANTES de confirmar.'
                                : '🚩 Entrega el efectivo DESPUÉS de confirmar.'}
                        </Text>
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmTransaction}>
                            <Text style={styles.confirmBtnText}>PROCESAR AHORA</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const SuccessModal = () => (
        <Modal visible={showSuccess} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.successCard}>
                    <View style={styles.successIconWrapper}>
                        <CheckCircle2 color="white" size={40} />
                    </View>
                    <Text style={styles.successTitle}>¡Completado!</Text>
                    <Text style={styles.successSub}>La operación se registró con éxito en la red.</Text>
                    <TouchableOpacity style={styles.successCloseBtn} onPress={() => { setShowSuccess(false); setOtpCode(''); }}>
                        <Text style={styles.successCloseText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <ConfirmationModal />
            <SuccessModal />

            {/* Keypad Modal con Animación Específica */}
            <Modal visible={showKeypad} transparent animationType="none" onRequestClose={closeKeypad}>
                <View style={styles.keypadOverlay}>
                    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeKeypad} />
                    </Animated.View>
                    <Animated.View style={[styles.keypadCard, { transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.keypadHeader}>
                            <Text style={styles.keypadTitle}>Código del Cliente</Text>
                        </View>
                        <View style={styles.modalCodeBoxes}>
                            {[0, 1, 2, 3].map((index) => (
                                <View key={index} style={[styles.codeBox, otpCode.length === index && styles.codeBoxActive, otpCode.length > index && styles.codeBoxFilled]}>
                                    <Text style={styles.codeDigit}>{otpCode[index] || ''}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.keypadGrid}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.keyItem}
                                    onPress={() => key === 'del' ? handleDelete() : (typeof key === 'number' && handleNumberPress(key))}
                                    disabled={key === ''}
                                >
                                    {key === 'del' ? <Delete color="white" size={24} /> : <Text style={styles.keyText}>{key}</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                </View>
            </Modal>


            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Premium Centrado */}
                <LinearGradient colors={['#000833', '#0026e3']} style={styles.header} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
                    <View style={styles.headerNav}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Main')}>
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>

                        {/* Power Switch (Pulso Cinético) - Ahora más grande y con Icono */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => toggleVisibility(!isActive)}
                            style={styles.orbTopRight}
                        >
                            {isActive && (
                                <Animated.View style={[
                                    styles.pulseAuraSmall,
                                    {
                                        transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
                                        opacity: pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.4, 0] })
                                    }
                                ]} />
                            )}
                            <Animated.View style={[
                                styles.orbCoreSmall,
                                {
                                    backgroundColor: statusColorAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['#ef4444', '#10b981']
                                    }),
                                    shadowColor: statusColorAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['#ef4444', '#10b981']
                                    })
                                }
                            ]}>
                                {isUpdatingVisibility ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Power color="white" size={20} strokeWidth={3} />
                                )}
                            </Animated.View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerMainContent}>
                        <View style={styles.headerMainContentCentered}>
                            <Text style={styles.businessName}>{businessData.name || 'Mi Comercio Bolito'}</Text>

                            <Animated.Text style={[
                                styles.statusTextSmall,
                                { color: statusColorAnim.interpolate({ inputRange: [0, 1], outputRange: ['#ef4444', '#10b981'] }) }
                            ]}>
                                {isActive ? 'PUNTO ACTIVO' : 'PUNTO EN PAUSA'}
                            </Animated.Text>

                            <View style={styles.balanceSection}>
                                <Text style={styles.balanceLabel}>SALDO</Text>
                                <View style={styles.balanceRow}>
                                    <Text style={styles.currencySymbol}>Bs.</Text>
                                    <Text style={styles.balanceValue}>{user?.balance ? Math.floor(user.balance).toLocaleString() : '0'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.contentWrapper}>
                    {/* Selector de Servicios */}
                    <View style={styles.servicesRow}>
                        <Animated.View style={{ flex: 1, transform: [{ scale: depositScale }] }}>
                            <TouchableOpacity style={[styles.serviceCard, services.includes('DEPÓSITO') && styles.serviceCardActive]} onPress={() => toggleService('DEPÓSITO')} activeOpacity={0.8}>
                                <Text style={[styles.serviceCardText, services.includes('DEPÓSITO') && styles.serviceCardTextActive]}>ACEPTO DEPÓSITOS</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        <Animated.View style={{ flex: 1, transform: [{ scale: retiroScale }] }}>
                            <TouchableOpacity style={[styles.serviceCard, services.includes('RETIRO') && styles.serviceCardActive]} onPress={() => toggleService('RETIRO')} activeOpacity={0.8}>
                                <Text style={[styles.serviceCardText, services.includes('RETIRO') && styles.serviceCardTextActive]}>ACEPTO RETIROS</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Área de Entrada de Código (Glassmorphism) */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.glassEntry, !isActive && { opacity: 0.4 }]}
                        onPress={() => isActive && setShowKeypad(true)}
                        disabled={!isActive}
                    >
                        <BlurView intensity={10} tint="light" style={styles.glassInner}>
                            <Text style={styles.entryLabel}>OPERACIÓN DEL CLIENTE</Text>
                            <View style={styles.mainCodeBoxes}>
                                {[0, 1, 2, 3].map((index) => (
                                    <View key={index} style={[styles.codeBox, otpCode.length === index && styles.codeBoxActive, otpCode.length > index && styles.codeBoxFilled]}>
                                        <Text style={styles.codeDigit}>{otpCode[index] || ''}</Text>
                                    </View>
                                ))}
                            </View>
                            {isVerifying ? (
                                <View style={styles.verifyingBox}><ActivityIndicator size="small" color="#3b82f6" /><Text style={styles.verifyingText}>Validando en la red...</Text></View>
                            ) : (
                                <Text style={[styles.tapText, !isActive && { color: '#ef4444' }]}>
                                    {isActive ? 'Toca para ingresar el código de 4 dígitos' : 'Activa tu punto para recibir operaciones'}
                                </Text>
                            )}
                        </BlurView>
                    </TouchableOpacity>

                    {/* Historial Real de Puntos */}
                    <View style={styles.historySection}>
                        <Text style={styles.sectionTitle}>Operaciones Recientes</Text>
                        {transactionHistory.length > 0 ? (
                            transactionHistory.map((item, idx) => (
                                <View key={item.id} style={styles.recentTxItem}>
                                    <View style={styles.txIconBox}>
                                        {item.type === 'DEPÓSITO' ? <TrendingUp color="#10b981" size={18} /> : <TrendingDown color="#3b82f6" size={18} />}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.txTypeTitle}>{item.type}</Text>
                                        <Text style={styles.txDate}>
                                            {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} - {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.txAmountText, { color: item.type === 'DEPÓSITO' ? '#10b981' : '#3b82f6' }]}>
                                            {item.type === 'DEPÓSITO' ? '+' : '-'} Bs. {Math.floor(item.amount)}
                                        </Text>
                                        <Text style={styles.txComisionText}>+1 Bs. Bono</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyTitle}>Sin actividad reciente</Text>
                                <Text style={styles.emptySub}>Tus transacciones de hoy aparecerán aquí.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a1128' },
    header: {
        height: 380,
        paddingTop: 50,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    headerNav: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    headerMainContent: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
    },
    headerMainContentCentered: {
        alignItems: 'center',
        paddingBottom: 20, // Balance visual con el nav superior
    },
    orbTopRight: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    orbCoreSmall: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 2,
    },
    pulseAuraSmall: {
        position: 'absolute',
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#10b981',
        zIndex: 1,
    },
    statusTextSmall: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 15,
    },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

    businessName: { color: 'white', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 5, textAlign: 'center' },

    balanceSection: { alignItems: 'center', marginTop: 10 },
    balanceLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        letterSpacing: 2,
        fontWeight: '900',
        marginBottom: 4
    },
    balanceRow: { flexDirection: 'row', alignItems: 'flex-start' },
    currencySymbol: { color: 'rgba(255,255,255,0.6)', fontSize: 24, fontWeight: '700', marginTop: 12, marginRight: 4 },
    balanceValue: { color: 'white', fontSize: 68, fontWeight: 'bold', letterSpacing: -2, textAlign: 'center' },

    scroll: { flex: 1 },
    scrollContent: { paddingTop: 0, paddingBottom: 50 },
    contentWrapper: { paddingHorizontal: 25, paddingTop: 30 },

    servicesRow: { flexDirection: 'row', gap: 20, marginBottom: 35 },
    serviceCard: { height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    serviceCardActive: { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.5)' },
    serviceCardText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '800' },
    serviceCardTextActive: { color: '#10b981' },

    glassEntry: { borderRadius: 28, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 40 },
    glassInner: { paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
    entryLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 3, fontWeight: '900', marginBottom: 30 },
    mainCodeBoxes: { flexDirection: 'row', gap: 14 },
    codeBox: { width: 64, height: 76, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    codeBoxActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.15)' },
    codeBoxFilled: { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.12)' },
    codeDigit: { color: 'white', fontSize: 34, fontWeight: 'bold' },
    verifyingBox: { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
    verifyingText: { color: '#3b82f6', marginLeft: 10, fontWeight: '700' },
    tapText: { color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 25, fontWeight: '600' },

    historySection: { marginTop: 10 },
    sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    recentTxItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    txIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    txTypeTitle: { color: 'white', fontSize: 14, fontWeight: '700' },
    txDate: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 },
    txAmountText: { fontSize: 15, fontWeight: 'bold' },
    txComisionText: { color: '#10b981', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
    emptyBox: { alignItems: 'center', paddingVertical: 50, borderRadius: 25, borderStyle: 'dashed', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
    emptyTitle: { color: 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '700' },
    emptySub: { color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 4 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    confirmationCard: { width: '100%', backgroundColor: 'white', borderRadius: 32, padding: 25, borderWidth: 1.5, borderColor: '#e2e8f0' },
    confirmationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 25 },
    confirmationTitle: { flex: 1, color: '#1e293b', fontSize: 18, fontWeight: 'bold' },
    userInfoContainer: { alignItems: 'center', marginBottom: 30 },
    userName: { color: '#1e293b', fontSize: 24, fontWeight: 'bold' },
    userRole: { color: '#3b82f6', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
    transactionSummaryBox: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 18, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { color: '#64748b', fontSize: 12 },
    summaryValue: { fontSize: 14, fontWeight: '800' },
    amountValue: { color: '#1e293b', fontSize: 20, fontWeight: 'bold' },
    instructionBox: { padding: 15, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', marginBottom: 25 },
    instructionText: { fontSize: 13, textAlign: 'center', fontWeight: '800' },
    modalActions: { marginTop: 10 },
    confirmBtn: { height: 60, borderRadius: 30, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
    confirmBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    successCard: { width: '80%', backgroundColor: 'white', borderRadius: 35, padding: 35, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
    successIconWrapper: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    successTitle: { color: '#1e293b', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    successSub: { color: '#64748b', textAlign: 'center', marginBottom: 30 },
    successCloseBtn: { width: '100%', height: 54, borderRadius: 27, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    successCloseText: { color: '#1e293b', fontWeight: 'bold' },

    keypadOverlay: { flex: 1, justifyContent: 'flex-end' },
    keypadCard: { backgroundColor: '#111b3d', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: 40, paddingTop: 25, paddingHorizontal: 30 },
    modalCodeBoxes: { flexDirection: 'row', gap: 15, justifyContent: 'center', marginBottom: 40 },
    keypadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    keypadTitle: { flex: 1, color: 'white', fontSize: 18, fontWeight: 'bold' },
    closeKeypadBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    keypadGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
    keyItem: { width: '28%', aspectRatio: 1.2, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    keyText: { color: 'white', fontSize: 28, fontWeight: '600' }
});
