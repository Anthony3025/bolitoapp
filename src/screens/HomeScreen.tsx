import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Switch, Modal, Platform, RefreshControl, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Plus,
    Minus,
    CreditCard,
    Send,
    Landmark,
    Lightbulb,
    ShieldCheck,
    Bell,
    User,
    Eye,
    EyeOff,
    Store,
    UserCircle,
    Smartphone,
    QrCode,
    X
} from 'lucide-react-native';
import { useCashierStore } from '../store/cashierStore';

const BolitoCommerceIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Pin Shape */}
        <Path
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2Z"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* La "B" de Bolito dentro del Pin */}
        <Path
            d="M10 6.5H12.5C13.3284 6.5 14 7.17157 14 8C14 8.82843 13.3284 9.5 12.5 9.5H10V6.5Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
        <Path
            d="M10 9.5H13C13.8284 9.5 14.5 10.1716 14.5 11C14.5 11.8284 13.8284 12.5 13 12.5H10V9.5Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
        <Path
            d="M10 6.5V12.5"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </Svg>
);

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const fetchProfile = useAuthStore((state) => state.fetchProfile);
    const [showBalance, setShowBalance] = React.useState(true);
    const [showAddMenu, setShowAddMenu] = React.useState(false);
    const [showWithdrawMenu, setShowWithdrawMenu] = React.useState(false);
    const [refreshing, setRefreshing] = React.useState(false);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    const { isCashierMode, setIsCashierMode, registrationStatus } = useCashierStore();

    // Estados para datos reales
    const [activeProtections, setActiveProtections] = React.useState(0);
    const [realTransactions, setRealTransactions] = React.useState<any[]>([]);

    React.useEffect(() => {
        fetchDashboardData();
    }, [user?.id]);

    // Escuchar si venimos de un pago exitoso para recargar
    useFocusEffect(
        React.useCallback(() => {
            if (user?.id) {
                console.log('Dashboard: Focus refreshed');
                fetchDashboardData();
            }
        }, [user?.id])
    );

    const startPulse = React.useCallback(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    const stopPulse = React.useCallback(() => {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    }, [pulseAnim]);

    const onRefresh = React.useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        startPulse();
        try {
            if (user?.id) {
                await fetchProfile(user.id);
                await fetchDashboardData(); // Recargar datos del dashboard al refrescar
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Refresh error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setRefreshing(false);
            stopPulse();
        }
    }, [user?.id, fetchProfile, startPulse, stopPulse]);

    const handleCajeroToggle = (value: boolean) => {
        if (value) {
            if (registrationStatus !== 'active') {
                navigation.navigate('CashierSetup');
            } else {
                setIsCashierMode(true);
                navigation.navigate('CashierDashboard');
            }
        } else {
            setIsCashierMode(false);
        }
    };

    const handleAction = (type: string) => {
        if (type === 'Perfil') {
            navigation.navigate('Profile');
        } else if (type === 'Enviar') {
            navigation.navigate('SendMoney');
        } else if (type === 'Recargar') {
            navigation.navigate('PhoneRecharge');
        } else if (type === 'Servicios') {
            navigation.navigate('PayServices');
        } else if (type === 'Banco') {
            navigation.navigate('BankTransfer');
        } else {
            Alert.alert(`${type}`, `${type} no está disponible en este MVP aún.`);
        }
    };

    const fetchDashboardData = async () => {
        if (!user?.id) return;
        try {
            console.log('Dashboard: Fetching data for user', user.id);
            console.log('User phone:', user.phone);

            // 1. Contar protecciones activas donde soy COMPRADOR
            const { data: buyerProtections, error: buyerError } = await supabase
                .from('safety_payments')
                .select('id')
                .eq('buyer_id', user.id)
                .eq('status', 'active');

            // 2. Contar protecciones activas donde soy VENDEDOR
            // Buscar por UUID O por teléfono (compatibilidad con QRs viejos)
            const { data: sellerProtections, error: sellerError } = await supabase
                .from('safety_payments')
                .select('id')
                .or(`seller_id.eq.${user.id},seller_id.eq.${user.phone}`)
                .eq('status', 'active');

            const buyerCount = buyerProtections?.length || 0;
            const sellerCount = sellerProtections?.length || 0;
            const totalProtections = buyerCount + sellerCount;

            console.log(`Dashboard: ${buyerCount} compras, ${sellerCount} ventas = ${totalProtections} total`);
            setActiveProtections(totalProtections);

            // 3. Traer últimas transacciones SOLO COMPLETADAS
            const { data: txns, error: txnError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'completed') // SOLO completadas
                .order('created_at', { ascending: false })
                .limit(4);

            if (!txnError && txns) {
                setRealTransactions(txns);
            }
        } catch (e) {
            console.log('Error fetching dashboard', e);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0026e3']} // Android
                        tintColor={'#0026e3'} // iOS
                    />
                }
            >
                {/* Header Azul con Gradiente Sutil */}
                <LinearGradient
                    colors={['#000833', '#0026e3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.topRow}>
                        <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] || 'Juan'}</Text>
                        <View style={styles.headerIcons}>
                            {/* Perfil siempre visible a la izquierda del grupo de iconos */}
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => handleAction('Perfil')}
                                activeOpacity={0.7}
                                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            >
                                <User color="white" size={28} strokeWidth={1.5} />
                            </TouchableOpacity>

                            {/* Icono de Modo Cajero (Icono C Personalizado) solo si está activo */}
                            {isCashierMode && (
                                <TouchableOpacity
                                    style={[styles.iconBtn, { marginLeft: 12, marginTop: -8 }]}
                                    onPress={() => navigation.navigate('CashierDashboard')}
                                >
                                    <BolitoCommerceIcon color="#4ade80" size={26} />
                                    <View style={styles.notifBadge} />
                                    <Text style={styles.iconLabel}>CAJERO ACTIVO</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.balanceSection}>
                        <TouchableOpacity
                            style={styles.saldoLabelRow}
                            onPress={() => setShowBalance(!showBalance)}
                        >
                            <Text style={styles.saldoLabel}>Saldo disponible:</Text>
                            {showBalance ? <Eye color="white" size={18} strokeWidth={1.5} /> : <EyeOff color="white" size={18} strokeWidth={1.5} />}
                        </TouchableOpacity>
                        <Animated.Text style={[styles.balanceText, { opacity: pulseAnim }]}>
                            {showBalance ? `Bs. ${user?.balance?.toFixed(2) || '0.00'}` : 'Bs. ••••••'}
                        </Animated.Text>

                    </View>

                    {/* Botones de Acción Superpuestos con mejor sombra y curvas */}
                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            style={styles.pillButton}
                            onPress={() => setShowAddMenu(true)}
                        >
                            <View style={styles.pillIconBg}>
                                <Plus color="#0026e3" size={24} strokeWidth={2.5} />
                            </View>
                            <Text style={styles.pillButtonText}>Agregar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.pillButton}
                            onPress={() => setShowWithdrawMenu(true)}
                        >
                            <View style={styles.pillIconBg}>
                                <Minus color="#0026e3" size={24} strokeWidth={2.5} />
                            </View>
                            <Text style={styles.pillButtonText}>Retirar</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={styles.mainContent}>
                    {/* Grid de Servicios con Proporción de la Imagen */}
                    <View style={styles.servicesGrid}>
                        <TouchableOpacity style={styles.serviceBox} onPress={() => handleAction('Recargar')}>
                            <View style={styles.serviceIconContainer}>
                                <CreditCard color="#0026e3" size={28} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.serviceLabel}>Recargar crédito</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.serviceBox} onPress={() => handleAction('Enviar')}>
                            <View style={styles.serviceIconContainer}>
                                <Send color="#0026e3" size={28} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.serviceLabel}>Enviar a otro Bolito</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.serviceBox} onPress={() => handleAction('Banco')}>
                            <View style={styles.serviceIconContainer}>
                                <Landmark color="#0026e3" size={28} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.serviceLabel}>Enviar a Banco</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.serviceBox} onPress={() => handleAction('Servicios')}>
                            <View style={styles.serviceIconContainer}>
                                <Lightbulb color="#0026e3" size={28} strokeWidth={1.5} />
                            </View>
                            <Text style={styles.serviceLabel}>Pagar servicios</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tarjeta Protección Activa (Solo si hay operaciones reales > 0) */}
                    {activeProtections > 0 && (
                        <View style={styles.protectionCard}>
                            <View style={styles.protectionHeader}>
                                <ShieldCheck color="#00d68f" size={24} fill="#00d68f" style={{ marginRight: 12 }} />
                                <View style={styles.protectionInfo}>
                                    <Text style={styles.protectionTitle}>Protección Activa</Text>
                                    <Text style={styles.protectionSub}>{activeProtections} {activeProtections === 1 ? 'Operación' : 'Operaciones'} en curso</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.verDetallesBtn}
                                    onPress={() => navigation.navigate('ProtectedOperations')}
                                >
                                    <Text style={styles.verDetallesText}>VER DETALLES</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {!isCashierMode && <Text style={styles.brandPromoText}>Sácale el provecho a Bolito</Text>}

                    {/* Tarjeta de Promoción - Solo aparece si el modo NO está activo */}
                    {!isCashierMode && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => handleCajeroToggle(true)}
                        >
                            <LinearGradient
                                colors={['#000833', '#0026e3']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cajeroCard}
                            >
                                <View style={styles.cajeroLeft}>
                                    <Text style={styles.cajeroTitle}>¿Tienes un negocio?</Text>
                                    <Text style={styles.cajeroSubtitle}>Conviértete en Punto Bolito y genera comisiones.</Text>
                                </View>
                                <View style={styles.cajeroRight}>
                                    <View style={styles.switchHeader}>
                                        <Text style={styles.cajeroLabel}>Activar</Text>
                                        <Text style={styles.cajeroLabel}>Modo Cajero</Text>
                                    </View>
                                    <Switch
                                        value={false}
                                        onValueChange={() => handleCajeroToggle(true)}
                                        trackColor={{ false: '#6366f1', true: 'rgba(255, 255, 255, 0.4)' }}
                                        thumbColor={'#ffffff'}
                                        style={styles.cajeroSwitch}
                                    />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}


                    {/* Sección Movimientos con estilo Yape/Nubank */}
                    <Text style={styles.sectionHeading}>Movimientos</Text>

                    <View style={styles.transactionsContainer}>
                        {realTransactions.length > 0 ? (
                            realTransactions.map((item, idx) => (
                                <View key={item.id} style={styles.transactionWrapper}>
                                    <View style={styles.transactionRow}>
                                        <View style={styles.transactionData}>
                                            <Text style={styles.transactionTitle}>{item.description || 'Transacción'}</Text>
                                            <Text style={styles.transactionDate}>
                                                {new Date(item.created_at).toLocaleDateString()} - {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        <View style={styles.transactionAmountSection}>
                                            <Text style={[styles.transactionAmount, { color: item.amount >= 0 ? '#10b981' : '#ef4444' }]}>
                                                {item.amount >= 0 ? '+' : ''} Bs. {Math.abs(item.amount).toFixed(2)}
                                            </Text>
                                            <View style={styles.statusRow}>
                                                {/* Escudo Verde SOLO si es protegida Y completada */}
                                                {(item.type === 'PROTECTED_PAYMENT' || item.metadata?.protected) && (
                                                    <ShieldCheck color="#00d68f" size={14} fill="#00d68f" style={{ marginRight: 4 }} />
                                                )}
                                                <Text style={[styles.statusText, item.type === 'PROTECTED_PAYMENT' && { color: '#00d68f', fontWeight: 'bold' }]}>
                                                    {item.status === 'completed' ? (item.type === 'PROTECTED_PAYMENT' ? 'Protegido' : 'Completado') : item.status}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    {idx < realTransactions.length - 1 && <View style={styles.listDivider} />}
                                </View>
                            ))
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#9ca3af' }}>No hay movimientos recientes</Text>
                            </View>
                        )}
                    </View>

                    {/* Botón Ver Todos los Movimientos */}
                    <TouchableOpacity
                        style={styles.verTodosBtn}
                        onPress={() => navigation.navigate('TransactionHistory')}
                    >
                        <Text style={styles.verTodosText}>Ver todos los movimientos</Text>
                    </TouchableOpacity>
                </View>

                {/* Margen inferior para TabBar */}
                <View style={{ height: 120 }} />
            </ScrollView >
            {/* Modal para Agregar Dinero */}
            <Modal
                visible={showAddMenu}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAddMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAddMenu(false)}
                >
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Agregar Saldo</Text>
                            <TouchableOpacity onPress={() => setShowAddMenu(false)}>
                                <X size={24} color="#1f2937" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.sheetOption}
                            onPress={() => { setShowAddMenu(false); navigation.navigate('Puntos', { initialTab: 'depositar' }); }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#e0e7ff' }]}>
                                <Store color="#0026e3" size={24} />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Punto Bolito</Text>
                                <Text style={styles.optionSub}>Carga en establecimientos físicos</Text>
                            </View>
                        </TouchableOpacity>


                        <TouchableOpacity style={styles.sheetOption} onPress={() => { setShowAddMenu(false); navigation.navigate('BankCardAdd'); }}>
                            <View style={[styles.optionIcon, { backgroundColor: '#fff7ed' }]}>
                                <CreditCard color="#f97316" size={24} />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Tarjeta Bancaria</Text>
                                <Text style={styles.optionSub}>Carga saldo con tu tarjeta</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sheetOption}
                            onPress={() => { setShowAddMenu(false); navigation.navigate('MyQR'); }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#fdf4ff' }]}>
                                <QrCode color="#a855f7" size={24} />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Mi Código QR</Text>
                                <Text style={styles.optionSub}>Muestra tu QR para recibir saldo</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sheetOption}
                            onPress={() => { setShowAddMenu(false); navigation.navigate('ATMTemporaryCode'); }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#f1f5f9' }]}>
                                <Smartphone color="#475569" size={24} />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Cajero Automático</Text>
                                <Text style={styles.optionSub}>Carga saldo en la red de ATMs</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal para Retirar Dinero */}
            <Modal
                visible={showWithdrawMenu}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowWithdrawMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowWithdrawMenu(false)}
                >
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Retirar Efectivo</Text>
                            <TouchableOpacity onPress={() => setShowWithdrawMenu(false)}>
                                <X size={24} color="#1f2937" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.sheetOption}
                            onPress={() => { setShowWithdrawMenu(false); navigation.navigate('Puntos', { initialTab: 'retirar' }); }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#e0e7ff' }]}>
                                <Store color="#0026e3" size={24} />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Punto Bolito</Text>
                                <Text style={styles.optionSub}>Retira en locales físicos</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sheetOption}
                            onPress={() => { setShowWithdrawMenu(false); navigation.navigate('ATMTemporaryCode'); }}
                        >
                            <View style={[styles.optionIcon, { backgroundColor: '#fef2f2' }]}>
                                <Smartphone color="#ef4444" size={24} />
                            </View>
                            <View>
                                <Text style={styles.optionTitle}>Cajero Automático</Text>
                                <Text style={styles.optionSub}>Usa la red de ATMs compatible</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9', // Fondo gris muy claro para contraste
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 65,
        paddingBottom: 60,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 45,
        borderBottomRightRadius: 45,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    greeting: {
        color: 'white',
        fontSize: 26,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'center',
    },
    iconBtn: {
        alignItems: 'center',
        marginLeft: 5,
        padding: 10,
        zIndex: 10,
    },
    iconLabel: {
        color: '#4ade80',
        fontSize: 8,
        fontWeight: '900',
        marginTop: 2,
    },
    notifBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4ade80',
        borderWidth: 2,
        borderColor: '#0026e3',
    },
    balanceSection: {
        marginTop: 30,
    },
    saldoLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    saldoLabel: {
        color: 'white',
        fontSize: 15,
        opacity: 0.9,
    },
    balanceText: {
        color: 'white',
        fontSize: 52,
        fontWeight: 'bold',
        marginTop: 2,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 18,
        position: 'absolute',
        bottom: -32,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
    },
    pillButton: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        flex: 1,
        borderRadius: 35,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 12,
    },
    pillIconBg: {
        marginRight: 8,
    },
    pillButtonText: {
        color: '#0026e3',
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionItem: {
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        flex: 1,
        borderRadius: 35,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 12,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    actionLabel: {
        fontSize: 10,
        color: '#16a34a',
        fontWeight: 'bold',
    },
    mainContent: {
        marginTop: 55,
        paddingHorizontal: 18,
    },
    servicesGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    serviceBox: {
        width: '23%',
        backgroundColor: 'white',
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        height: 90, // Más cuadrado y compacto
    },
    serviceIconContainer: {
        marginBottom: 8,
    },
    serviceLabel: {
        fontSize: 10,
        color: '#003ecb',
        textAlign: 'center',
        fontWeight: '700',
        paddingHorizontal: 2,
        lineHeight: 12,
        maxWidth: 70, // Fuerza el salto de línea
    },
    protectionCard: {
        backgroundColor: '#e6fcf5',
        borderRadius: 24,
        padding: 16,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#00d68f15',
    },
    protectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    protectionInfo: {
        flex: 1,
    },
    protectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#004d33',
    },
    protectionSub: {
        fontSize: 14,
        color: '#006644',
        marginTop: 2,
    },
    verDetallesBtn: {
        borderWidth: 1.5,
        borderColor: '#004d33',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
    },
    verDetallesText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#004d33',
    },
    brandPromoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        fontStyle: 'italic',
        marginBottom: 20,
        marginTop: 5,
    },
    cajeroCard: {
        padding: 20,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        ...Platform.select({
            ios: {
                shadowColor: '#0026e3',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 15,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    cajeroLeft: {
        flex: 1,
    },
    cajeroTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cajeroSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 13,
        lineHeight: 18,
    },
    cajeroRight: {
        alignItems: 'center',
        marginLeft: 15,
    },
    cajeroLabel: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    switchHeader: {
        marginBottom: 5,
    },
    cajeroSwitch: {
        transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
    },
    sectionHeading: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 15,
    },
    transactionsContainer: {
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    transactionWrapper: {
        paddingHorizontal: 15,
    },
    transactionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
    },
    transactionData: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1f2937',
    },
    transactionDate: {
        fontSize: 13,
        color: '#9ca3af',
        marginTop: 2,
    },
    transactionAmountSection: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1f2937',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
    listDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    verTodosBtn: {
        backgroundColor: '#0026e3',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    verTodosText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    // Nuevos estilos para los menús de acción
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        paddingBottom: 40,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    optionIcon: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    optionSub: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
});
