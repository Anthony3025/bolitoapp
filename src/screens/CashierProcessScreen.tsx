import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ShieldCheck, CheckCircle2, ArrowRightLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function CashierProcessScreen({ route, navigation }: any) {
    const { qrData } = route.params || {};
    const [status, setStatus] = useState<'processing' | 'success'>('processing');
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    let paymentData;
    try {
        paymentData = JSON.parse(qrData);
    } catch (e) {
        paymentData = {};
    }

    useEffect(() => {
        // Simular procesamiento
        const timer = setTimeout(() => {
            setStatus('success');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Auto exit after success
            setTimeout(() => {
                navigation.navigate('Main');
            }, 3500);
        }, 2000);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#000833', '#0026e3']}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {status === 'processing' ? (
                    <>
                        <View style={styles.iconContainer}>
                            <ArrowRightLeft size={60} color="white" />
                            {/* Simple loader simulation */}
                            <View style={styles.loader} />
                        </View>
                        <Text style={styles.title}>Procesando Operación</Text>
                        <Text style={styles.subtitle}>Sincronizando con la red Bolito...</Text>

                        <View style={styles.detailsBox}>
                            <Text style={styles.detailLabel}>USUARIO</Text>
                            <Text style={styles.detailValue}>{paymentData.userName || 'Usuario Bolito'}</Text>
                            <Text style={styles.detailPhone}>{paymentData.userId || '---'}</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={[styles.iconContainer, styles.successIcon]}>
                            <CheckCircle2 size={80} color="#10b981" />
                        </View>
                        <Text style={styles.title}>¡Operación Exitosa!</Text>
                        <Text style={styles.subtitle}>El monto ha sido procesado automáticamente.</Text>

                        <View style={styles.successCard}>
                            <ShieldCheck size={24} color="#10b981" style={{ marginBottom: 10 }} />
                            <Text style={styles.successAmount}>
                                {paymentData.operationType} {paymentData.amount ? `Bs. ${paymentData.amount}` : ''}
                            </Text>
                            <Text style={styles.successRef}>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
                        </View>

                        {paymentData.type === 'cashier_operation' && (
                            <View style={styles.commissionCard}>
                                <Text style={styles.commissionLabel}>COMISIÓN GANADA</Text>
                                <Text style={styles.commissionValue}>+ 1.00 BS</Text>
                            </View>
                        )}

                        <Text style={styles.redirectText}>Volviendo al dashboard...</Text>
                    </>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    successIcon: {
        backgroundColor: 'white',
    },
    loader: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderTopColor: 'white',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 40,
    },
    detailsBox: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: 2,
        marginBottom: 8,
    },
    detailValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    detailPhone: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
    },
    successCard: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    successAmount: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
    },
    successRef: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 10,
        fontWeight: '600',
    },
    redirectText: {
        marginTop: 40,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    commissionCard: {
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 15,
        marginTop: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    commissionLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#16a34a',
        letterSpacing: 1,
    },
    commissionValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#15803d',
    },
});
