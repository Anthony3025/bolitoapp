import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CreditCard, Calendar, Lock, User, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export default function BankCardAddScreen() {
    const navigation = useNavigation<any>();
    const [amount, setAmount] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleProcess = () => {
        if (!amount || !cardNumber || !expiry || !cvv || !cardName) {
            Alert.alert('Error', 'Por favor completa todos los campos.');
            return;
        }

        setIsProcessing(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Simular procesamiento
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 2500);
    };

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const match = cleaned.match(/.{1,4}/g);
        return match ? match.join(' ') : cleaned;
    };

    const formatExpiry = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    };

    if (isSuccess) {
        return (
            <View style={styles.successContainer}>
                <StatusBar style="dark" />
                <View style={styles.successCard}>
                    <CheckCircle2 size={80} color="#10b981" strokeWidth={1.5} />
                    <Text style={styles.successTitle}>¡Carga Exitosa!</Text>
                    <Text style={styles.successAmount}>Bs. {amount}</Text>
                    <Text style={styles.successSub}>Tu saldo ha sido actualizado correctamente.</Text>

                    <TouchableOpacity
                        style={styles.backHomeBtn}
                        onPress={() => navigation.navigate('Main')}
                    >
                        <Text style={styles.backHomeBtnText}>Volver al Inicio</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="light" />
            <LinearGradient
                colors={['#000833', '#0026e3']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CARGAR SALDO</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Visual Card Representation */}
                <LinearGradient
                    colors={['#334155', '#1e293b']}
                    style={styles.visualCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.cardTop}>
                        <CreditCard color="white" size={32} opacity={0.8} />
                        <Text style={styles.bankName}>TARJETA BANCARIA</Text>
                    </View>
                    <Text style={styles.visualCardNumber}>
                        {cardNumber ? formatCardNumber(cardNumber) : '**** **** **** ****'}
                    </Text>
                    <View style={styles.cardBottom}>
                        <View>
                            <Text style={styles.cardLabel}>TITULAR</Text>
                            <Text style={styles.cardValue}>{cardName || 'NOMBRE APELLIDO'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cardLabel}>EXPIRA</Text>
                            <Text style={styles.cardValue}>{expiry || 'MM/AA'}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.form}>
                    <Text style={styles.sectionTitle}>Monto Bolito a cargar</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.currencyPrefix}>Bs.</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    <Text style={styles.sectionTitle}>Datos de la tarjeta</Text>

                    <View style={styles.fieldLabel}>
                        <User size={16} color="#6b7280" />
                        <Text style={styles.labelText}>Nombre en la tarjeta</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Juan Perez"
                        value={cardName}
                        onChangeText={setCardName}
                        autoCapitalize="characters"
                    />

                    <View style={styles.fieldLabel}>
                        <CreditCard size={16} color="#6b7280" />
                        <Text style={styles.labelText}>Número de tarjeta</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="0000 0000 0000 0000"
                        keyboardType="numeric"
                        maxLength={19}
                        value={formatCardNumber(cardNumber)}
                        onChangeText={(text) => setCardNumber(text.replace(/\s/g, ''))}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <View style={styles.fieldLabel}>
                                <Calendar size={16} color="#6b7280" />
                                <Text style={styles.labelText}>Vencimiento</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="MM/AA"
                                keyboardType="numeric"
                                maxLength={5}
                                value={formatExpiry(expiry)}
                                onChangeText={(text) => setExpiry(text.replace(/\//g, ''))}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <View style={styles.fieldLabel}>
                                <Lock size={16} color="#6b7280" />
                                <Text style={styles.labelText}>CVV</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="123"
                                keyboardType="numeric"
                                maxLength={3}
                                secureTextEntry
                                value={cvv}
                                onChangeText={setCvv}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.processBtn, isProcessing && { opacity: 0.7 }]}
                        onPress={handleProcess}
                        disabled={isProcessing}
                    >
                        <LinearGradient
                            colors={['#0026e3', '#001bb3']}
                            style={styles.gradientBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.processBtnText}>
                                {isProcessing ? 'Procesando...' : `Cargar Bs. ${amount || '0.00'}`}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.securityInfo}>
                        <Lock size={14} color="#64748b" />
                        <Text style={styles.securityText}>Pago 100% seguro y encriptado</Text>
                    </View>
                </View>
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
        height: 120,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    visualCard: {
        height: 200,
        borderRadius: 20,
        padding: 25,
        justifyContent: 'space-between',
        marginBottom: 30,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12 },
            android: { elevation: 8 }
        })
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bankName: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        opacity: 0.6,
    },
    visualCardNumber: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 2,
        textAlign: 'center',
    },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    cardLabel: {
        color: 'white',
        fontSize: 10,
        opacity: 0.5,
        marginBottom: 4,
    },
    cardValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    form: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
        marginTop: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 20,
        height: 65,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    currencyPrefix: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0026e3',
        marginRight: 10,
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    fieldLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 5,
    },
    labelText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 16,
        color: '#1e293b',
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
    },
    processBtn: {
        marginTop: 20,
        borderRadius: 20,
        overflow: 'hidden',
    },
    gradientBtn: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    processBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    securityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    securityText: {
        fontSize: 12,
        color: '#64748b',
        marginLeft: 6,
    },
    successContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    successCard: {
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 40,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 20,
    },
    successAmount: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#0026e3',
        marginVertical: 15,
    },
    successSub: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    backHomeBtn: {
        backgroundColor: '#0026e3',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 15,
        marginTop: 35,
    },
    backHomeBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
