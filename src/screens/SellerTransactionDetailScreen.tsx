import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ShieldCheck, Clock, Info, Bell, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import BolitoModal from '../components/BolitoModal';

export default function SellerTransactionDetailScreen({ route, navigation }: any) {
    const { item } = route.params || { item: { title: 'Venta PlayStation 5', amount: '3500.00', id: '#TX-4' } };
    const [status, setStatus] = React.useState<'CUSTODIA' | 'ENVIADO' | 'COMPLETADO' | 'MEDIACION'>(item.status === 'completed' ? 'COMPLETADO' : 'CUSTODIA');
    const [isNudged, setNudged] = React.useState(false);
    const [timeLeft, setTimeLeft] = React.useState(72 * 3600 - 120);
    const [pulseAnim] = React.useState(new Animated.Value(1));

    // Estado para el modal premium
    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalConfig, setModalConfig] = React.useState({
        title: '',
        message: '',
        type: 'info' as any,
        onConfirm: () => { },
        showCancel: false,
        confirmText: 'Entendido'
    });

    const showAlert = (title: string, message: string, type: any = 'info', onConfirm?: () => void, showCancel = false, confirmText = 'Entendido') => {
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
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    React.useEffect(() => {
        if (isNudged) {
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            // Animación de pulso para el borde
            const animate = () => {
                pulseAnim.setValue(1);
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: false,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: false,
                    }),
                ]).start(() => animate());
            };
            animate();
        }
    }, [isNudged]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
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
                <Text style={styles.headerTitle}>Venta Protegida</Text>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 50 }}
            >
                {/* Main Info Card */}
                <Animated.View style={[
                    styles.mainCard,
                    isNudged && {
                        borderColor: '#f59e0b',
                        borderWidth: 2,
                        transform: [{ scale: pulseAnim }]
                    }
                ]}>
                    {isNudged && (
                        <View style={styles.nudgeBanner}>
                            <Text style={styles.nudgeBannerText}>Tu comprador te ha enviado un recordatorio</Text>
                        </View>
                    )}

                    <View style={styles.badge}>
                        <Clock size={16} color="#10b981" style={{ marginRight: 6 }} />
                        <Text style={styles.badgeText}>EN CUSTODIA | {formatTime(timeLeft)}</Text>
                    </View>

                    <Text style={styles.mainAmount}>Bs. {item.amount}</Text>
                    <Text style={styles.mainSubtitle}>Vendido a un Cliente de Bolito</Text>
                    <Text style={styles.operationId}>ID de Operación: {item.id || '#TX-4'}</Text>

                    {isNudged && (
                        <View style={styles.rewardInfo}>
                            <Text style={styles.rewardText}>Envía hoy mismo para evitar posibles <Text style={styles.boldText}>mediaciones de seguridad</Text>.</Text>
                        </View>
                    )}
                </Animated.View>

                {/* Important Alert Box */}
                <View style={styles.importantBox}>
                    <Text style={styles.importantText}>
                        <Text style={styles.boldText}>IMPORTANTE:</Text> Toma fotos, videos cortos del embalaje, entrega al courier y guarda el voucher o guía al despachar o entregar el producto. Son requisitos obligatorios por si el comprador inicia una mediación.
                    </Text>
                </View>

                {/* Status Timeline */}
                <View style={styles.statusSection}>
                    <View style={styles.statusRow}>
                        <View style={styles.iconCircle}>
                            <ShieldCheck size={24} color="#10b981" />
                        </View>
                        <View style={styles.statusContent}>
                            <Text style={styles.statusTitle}>Dinero en Custodia</Text>
                            <Text style={styles.statusDescription}>
                                El pago está seguro. Se liberará a tu saldo cuando el comprador confirme la recepción.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statusRow}>
                        <View style={[styles.iconCircle, { backgroundColor: '#f3f4f6' }]}>
                            <Info size={24} color="#9ca3af" />
                        </View>
                        <View style={styles.statusContent}>
                            <Text style={styles.statusTitle}>Espera la confirmación</Text>
                            <Text style={styles.statusDescription}>
                                Una vez el comprador reciba el producto, deberá pulsar "Ya recibí el producto" para liberar tus Bs. {item.amount}.
                            </Text>
                        </View>
                    </View>
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
    operationId: {
        fontSize: 14,
        color: '#9ca3af',
    },
    importantBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 25,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    importantText: {
        fontSize: 14,
        color: '#1e3a8a',
        lineHeight: 22,
        textAlign: 'justify',
    },
    boldText: {
        fontWeight: 'bold',
    },
    statusSection: {
        marginTop: 30,
    },
    statusRow: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e6f9f3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    statusContent: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 5,
    },
    statusDescription: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
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
    rewardInfo: {
        marginTop: 15,
        backgroundColor: '#f0fdf4',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    rewardText: {
        fontSize: 12,
        color: '#15803d',
        textAlign: 'center',
    },
});
