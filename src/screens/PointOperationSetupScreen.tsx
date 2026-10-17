import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Navigation, MapPin, Wallet, ArrowDownCircle, ArrowUpCircle, CheckCircle2, Clock } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Rect } from 'react-native-svg';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function PointOperationSetupScreen({ route, navigation }: any) {
    const { point } = route.params || {};
    const user = useAuthStore((state) => state.user);

    const [opType, setOpType] = useState<'DEPÓSITO' | 'RETIRO'>('DEPÓSITO');
    const [amount, setAmount] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [code, setCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(25);
    const progress = React.useRef(new Animated.Value(1)).current;

    // Generate Initial Code
    useEffect(() => {
        if (showQR) {
            generateNewCode();
        }
    }, [showQR]);

    // Timer Logic for Text and Refresh
    useEffect(() => {
        if (!showQR) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    generateNewCode(); // Auto refresh
                    return 25;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [showQR, opType]);

    // Smooth Animation Logic
    useEffect(() => {
        if (showQR && code) {
            progress.setValue(1);
            Animated.timing(progress, {
                toValue: 0,
                duration: 25000,
                easing: Easing.linear,
                useNativeDriver: false,
            }).start();
        } else {
            progress.stopAnimation();
            progress.setValue(1);
        }
    }, [showQR, code]);

    const generateNewCode = async () => {
        // Generate first 3 random digits
        let newCode = Math.floor(Math.random() * 900 + 100).toString(); // 100-999

        // Generate last digit based on parity
        const isDeposit = opType === 'DEPÓSITO';
        let lastDigit = Math.floor(Math.random() * 5) * 2;
        if (isDeposit) lastDigit += 1;

        const finalCode = newCode + lastDigit;
        setCode(finalCode);
        setTimeLeft(25);

        // PERSISTIR EN BASE DE DATOS PARA EL CAJERO
        try {
            // Cancelar cualquier transacción pendiente previa del mismo cliente para este cajero
            await supabase
                .from('cashier_transactions')
                .update({ status: 'cancelled' })
                .eq('client_id', user?.id)
                .eq('cashier_id', point?.owner_id)
                .eq('status', 'pending');

            // Insertar la nueva
            const { error } = await supabase
                .from('cashier_transactions')
                .insert({
                    client_id: user?.id,
                    cashier_id: point?.owner_id,
                    type: opType,
                    amount: parseFloat(amount),
                    otp_code: finalCode,
                    status: 'pending',
                    expires_at: new Date(Date.now() + 10 * 60000).toISOString() // 10 min
                });

            if (error) console.error("Error saving OTP:", error);
        } catch (err) {
            console.error("Critical error saving OTP:", err);
        }
    };

    const handleOpenMap = () => {
        const daddr = encodeURIComponent(point?.address || 'Bolivia');
        const url = Platform.select({
            ios: `maps:0,0?q=${daddr}`,
            android: `geo:0,0?q=${daddr}`,
        });

        if (url) Linking.openURL(url);
    };

    const handleGenerate = () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Monto inválido', 'Por favor ingresa un monto mayor a 0');
            return;
        }
        setShowQR(true);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="light" />

            <LinearGradient
                colors={['#000833', '#0026e3']}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{opType === 'DEPÓSITO' ? 'Realizar Depósito' : 'Realizar Retiro'}</Text>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info del Punto */}
                <View style={styles.pointCard}>
                    <View style={styles.pointRow}>
                        <View style={styles.pointIconContainer}>
                            <MapPin size={24} color="#0026e3" />
                        </View>
                        <View style={styles.pointTextContainer}>
                            <Text style={styles.pointName}>{point?.name || 'Punto Bolito'}</Text>
                            <Text style={styles.pointAddress}>{point?.address || 'Dirección no disponible'}</Text>
                        </View>
                        <TouchableOpacity style={styles.gpsBtn} onPress={handleOpenMap}>
                            <Navigation size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {!showQR ? (
                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>¿Qué deseas realizar?</Text>

                        <View style={styles.tabsContainer}>
                            <TouchableOpacity
                                style={[styles.tab, opType === 'DEPÓSITO' && styles.activeTab]}
                                onPress={() => setOpType('DEPÓSITO')}
                            >
                                <ArrowDownCircle size={20} color={opType === 'DEPÓSITO' ? 'white' : '#64748b'} style={{ marginRight: 8 }} />
                                <Text style={[styles.tabText, opType === 'DEPÓSITO' && styles.activeTabText]}>DEPÓSITO</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, opType === 'RETIRO' && styles.activeTab]}
                                onPress={() => setOpType('RETIRO')}
                            >
                                <ArrowUpCircle size={20} color={opType === 'RETIRO' ? 'white' : '#64748b'} style={{ marginRight: 8 }} />
                                <Text style={[styles.tabText, opType === 'RETIRO' && styles.activeTabText]}>RETIRO</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Monto a {opType.toLowerCase()}</Text>
                        <View style={styles.amountInputContainer}>
                            <Text style={styles.currency}>Bs.</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                autoFocus
                            />
                        </View>



                        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
                            <Text style={styles.generateBtnText}>GENERAR CÓDIGO</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.qrContainer}>
                        <View style={styles.qrCard}>
                            <View style={[styles.typeBadge, { backgroundColor: opType === 'DEPÓSITO' ? '#ecfdf5' : '#fff1f2' }]}>
                                <Text style={[styles.typeBadgeText, { color: opType === 'DEPÓSITO' ? '#059669' : '#e11d48' }]}>
                                    CÓDIGO DE {opType}
                                </Text>
                            </View>

                            {/* Large Code Display */}
                            <View style={styles.codeDisplayWrapper}>
                                {code.split('').map((digit, index) => (
                                    <View key={index} style={styles.codeDigitBox}>
                                        <Text style={styles.codeDigitText}>{digit}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Timer Progress Bar */}
                            <View style={styles.timerContainer}>
                                <Animated.View style={[
                                    styles.timerBar,
                                    {
                                        width: progress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        })
                                    }
                                ]} />
                            </View>
                            <Text style={styles.timerText}>Se actualiza en {timeLeft}s</Text>


                            <Text style={styles.qrAmount}>Bs. {parseFloat(amount).toFixed(2)}</Text>
                            <Text style={styles.qrInstruction}>Dicta este código al cajero para procesar tu transacción.</Text>

                            <View style={styles.divider} />

                            <View style={styles.securityNote}>
                                <View style={[styles.pulseDot, { opacity: timeLeft % 2 ? 1 : 0.5 }]} />
                                <Text style={styles.securityNoteText}>Esperando confirmación del cajero...</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowQR(false)}>
                            <Text style={styles.cancelBtnText}>CANCELAR / CAMBIAR MONTO</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        height: 110,
        paddingTop: 50,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    scrollContent: {
        padding: 20,
    },
    pointCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    pointRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pointIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    pointTextContainer: {
        flex: 1,
    },
    pointName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    pointAddress: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    gpsBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#0026e3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 15,
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 25,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        height: 54,
        borderRadius: 15,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#0026e3',
        borderColor: '#0026e3',
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
    },
    activeTabText: {
        color: 'white',
    },
    label: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 10,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 20,
        height: 70,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    currency: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0026e3',
        marginRight: 10,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#eff6ff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 30,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 12,
        color: '#0026e3',
        marginLeft: 10,
        flex: 1,
        lineHeight: 18,
    },
    generateBtn: {
        backgroundColor: '#0026e3',
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    generateBtnText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    qrContainer: {
        alignItems: 'center',
    },
    qrCard: {
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 20,
    },
    typeBadge: {
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 10,
        marginBottom: 20,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    qrWrapper: {
        padding: 20, // Más espacio para el marco
        backgroundColor: 'white',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    smartFrameContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 10,
    },
    qrInstruction: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 15,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    securityNoteText: {
        fontSize: 12,
        color: '#0026e3',
        fontWeight: 'bold',
        marginLeft: 6,
    },
    cancelBtn: {
        padding: 15,
    },
    cancelBtnText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: 'bold',
    },
    codeDisplayWrapper: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 25,
        justifyContent: 'center',
    },
    codeDigitBox: {
        width: 60,
        height: 75,
        backgroundColor: '#eff6ff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    codeDigitText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#0026e3',
    },
    timerContainer: {
        width: '100%',
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    timerBar: {
        height: '100%',
        backgroundColor: '#0026e3',
        borderRadius: 3,
    },
    timerText: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 20,
        fontWeight: '600',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0026e3',
        marginRight: 8,
    }
});
