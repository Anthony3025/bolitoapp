import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Share2, Settings2, Clock, Info, ShieldCheck } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

const logoImg = require('../../assets/logo.png');

export default function MyQRScreen({ route, navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const [qrColor, setQrColor] = React.useState('black'); // Color por defecto

    // Paleta de colores (solo 4)
    const colors = ['black', '#0026e3', '#16a34a', '#dc2626'];

    const { customAmount, description, duration } = route.params || {};

    // QR logic simplified (no rotation)

    // Generar datos del QR Dinámico
    const qrData = React.useMemo(() => JSON.stringify({
        type: 'user_qr',
        userId: user?.id || user?.phone || '70000000', // UUID real del usuario
        phone: user?.phone || '70000000', // Teléfono para compatibilidad
        name: user?.name || 'Usuario',
        amount: customAmount ? parseFloat(customAmount) : null,
        description: description || null,
        timestamp: Date.now(),
    }), [user, customAmount, description]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Paga con Bolito escaneando mi QR dinámico: ${user?.name} ${customAmount ? `por Bs. ${customAmount}` : ''}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleEdit = () => {
        navigation.navigate('CustomizeQR');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header Curvo Premium */}
            <LinearGradient
                colors={['#000833', '#0026e3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={32} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Código QR</Text>
            </LinearGradient>

            <View style={styles.content}>
                {/* Tarjeta QR Central Pro */}
                <View style={styles.qrCard}>
                    {/* Logotipo Bolito Personalizado */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={logoImg}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* QR Code */}
                    {/* QR Code */}
                    <View style={styles.qrWrapper}>
                        <QRCode
                            value={qrData}
                            size={width * 0.55}
                            backgroundColor="white"
                            color={qrColor}
                        />
                    </View>

                    {/* Selector de Color */}
                    <View style={styles.colorSelectorContainer}>
                        <View style={styles.colorRow}>
                            {colors.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorCircle,
                                        { backgroundColor: c },
                                        qrColor === c && styles.colorCircleSelected
                                    ]}
                                    onPress={() => setQrColor(c)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* El timer ha sido eliminado */}

                    {/* Datos del Cobro / Usuario */}
                    <View style={styles.userDataContainer}>
                        <Text style={styles.userName}>{user?.name || 'Usuario Bolito'}</Text>
                        <Text style={styles.userPhone}>+591 {user?.phone || '--- ---'}</Text>

                        {(customAmount || description) && (
                            <View style={styles.customInfoBox}>
                                {customAmount && (
                                    <View style={styles.amountBadge}>
                                        <Text style={styles.amountLabel}>Monto:</Text>
                                        <Text style={styles.amountValue}>Bs. {customAmount}</Text>
                                    </View>
                                )}
                                {description && (
                                    <Text style={styles.descriptionText}>"{description}"</Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* Botones de Acción */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShare}
                        activeOpacity={0.8}
                    >
                        <Share2 size={24} color="white" style={{ marginRight: 10 }} />
                        <Text style={styles.actionText}>Compartir QR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleEdit}
                        activeOpacity={0.7}
                    >
                        <Settings2 size={24} color="#0026e3" style={{ marginRight: 10 }} />
                        <Text style={styles.editText}>Personalizar Cobro</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        height: 100, // Reducido
        paddingTop: 45,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 10, // Súper comprimido
        alignItems: 'center',
    },
    qrCard: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 20, // Reducido el padding interno
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    logoImage: {
        width: 120,
        height: 72,
        borderRadius: 10,
    },
    qrWrapper: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 10,
    },
    timerWrapper: {
        width: '80%',
        alignItems: 'center',
        marginBottom: 15,
    },
    progressBarBackground: {
        width: '100%',
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    timerLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timerText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    userDataContainer: {
        alignItems: 'center',
        width: '100%',
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 10,
    },
    securityBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0026e3',
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    userPhone: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 8, // Reducido
    },
    customInfoBox: {
        width: '100%',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        alignItems: 'center',
    },
    amountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 10,
    },
    amountLabel: {
        fontSize: 13,
        color: '#64748b',
        marginRight: 6,
    },
    amountValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    descriptionText: {
        fontSize: 14,
        color: '#64748b',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    actionsContainer: {
        width: '100%',
        marginTop: 15, // Reducido dramáticamente
        gap: 10,
    },
    shareButton: {
        backgroundColor: '#0026e3', // Color del Login
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    actionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: 'white',
    },
    editText: {
        color: '#1e293b',
        fontSize: 15,
        fontWeight: '700',
    },
    securityFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10, // Reducido
        opacity: 0.7,
    },
    securityText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    colorSelectorContainer: {
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 15,
    },
    colorLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
        marginBottom: 10,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    colorRow: {
        flexDirection: 'row',
        gap: 12,
    },
    colorCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    colorCircleSelected: {
        borderWidth: 3,
        borderColor: '#0026e3',
        transform: [{ scale: 1.15 }],
        shadowOpacity: 0.25,
    },
});
