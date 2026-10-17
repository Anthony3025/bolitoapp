import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Check, Landmark, User, CreditCard, ArrowRight } from 'lucide-react-native';

const BANKS = [
    { id: 'bnb', name: 'Banco Nacional de Bolivia' },
    { id: 'mercantil', name: 'Banco Mercantil Santa Cruz' },
    { id: 'union', name: 'Banco Unión' },
    { id: 'bcp', name: 'Banco de Crédito (BCP)' },
    { id: 'ganadero', name: 'Banco Ganadero' },
];

export default function BankTransferScreen({ navigation }: any) {
    const [step, setStep] = useState(1); // 1: Bank, 2: Details, 3: Confirm, 4: Success
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [account, setAccount] = useState('');
    const [holder, setHolder] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [step]);

    const handleSelectBank = (bank: any) => {
        setSelectedBank(bank);
        setStep(2);
    };

    const handleContinue = () => {
        if (!account || !holder || !amount) return;
        setStep(3);
    };

    const handleTransfer = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setStep(4);
        }, 2000);
    };

    const renderStep1 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>¿A qué banco enviamos?</Text>
            <ScrollView>
                {BANKS.map((bank) => (
                    <TouchableOpacity key={bank.id} style={styles.bankItem} onPress={() => handleSelectBank(bank)}>
                        <View style={styles.bankIconBg}>
                            <Landmark size={20} color="#0026e3" />
                        </View>
                        <Text style={styles.bankName}>{bank.name}</Text>
                        <ArrowRight size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <View style={styles.bankBadge}>
                <Text style={styles.bankBadgeText}>{selectedBank?.name}</Text>
            </View>
            <Text style={styles.sectionTitle}>Datos de la cuenta</Text>
            <View style={styles.form}>
                <Text style={styles.label}>NÚMERO DE CUENTA</Text>
                <TextInput style={styles.input} value={account} onChangeText={setAccount} keyboardType="numeric" placeholder="0000000000" />

                <Text style={styles.label}>NOMBRE DEL TITULAR</Text>
                <TextInput style={styles.input} value={holder} onChangeText={setHolder} placeholder="Nombre completo" />

                <Text style={styles.label}>MONTO A ENVIAR (BS.)</Text>
                <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
            </View>

            <TouchableOpacity
                style={[styles.mainBtn, (!account || !holder || !amount) && styles.btnDisabled]}
                onPress={handleContinue}
                disabled={!account || !holder || !amount}
            >
                <Text style={styles.mainBtnText}>REVISAR DATOS</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep3 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Verifica la información</Text>
            <View style={styles.confirmCard}>
                <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Banco</Text>
                    <Text style={styles.confirmValue}>{selectedBank?.name}</Text>
                </View>
                <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Titular</Text>
                    <Text style={styles.confirmValue}>{holder}</Text>
                </View>
                <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Cuenta</Text>
                    <Text style={styles.confirmValue}>{account}</Text>
                </View>
                <View style={[styles.confirmRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
                    <Text style={styles.confirmLabel}>Monto Final</Text>
                    <Text style={[styles.confirmValue, { fontSize: 22, color: '#0026e3' }]}>Bs. {amount}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.mainBtn} onPress={handleTransfer} disabled={isLoading}>
                <Text style={styles.mainBtnText}>{isLoading ? 'PROCESANDO...' : 'CONFIRMAR TRANSFERENCIA'}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep4 = () => (
        <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
            <View style={styles.successIcon}>
                <Check size={50} color="white" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Transferencia en proceso</Text>
            <Text style={styles.successDetail}>El dinero está en camino a la cuenta de {holder}.</Text>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('Main')}>
                <Text style={styles.outlineBtnText}>VOLVER AL INICIO</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={['#000833', '#0026e3']} style={styles.header}>
                <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(step - 1)}>
                    <ChevronLeft size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Enviar a Banco</Text>
                <View style={{ width: 28 }} />
            </LinearGradient>
            <View style={styles.content}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { height: 110, paddingTop: 50, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1, padding: 20 },
    stepContainer: { flex: 1 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 25 },
    bankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    bankIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    bankName: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
    bankBadge: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 15 },
    bankBadgeText: { color: '#0026e3', fontWeight: 'bold', fontSize: 12 },
    form: { gap: 15 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginLeft: 5 },
    input: { backgroundColor: 'white', height: 60, borderRadius: 16, paddingHorizontal: 15, fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b' },
    spacer: { flex: 1 },
    mainBtn: { backgroundColor: '#0026e3', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#0026e3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, marginTop: 40, marginBottom: 20 },
    btnDisabled: { backgroundColor: '#cbd5e1' },
    mainBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    confirmCard: { backgroundColor: 'white', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#f1f5f9' },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    confirmLabel: { color: '#94a3b8', fontSize: 14 },
    confirmValue: { color: '#1e293b', fontSize: 15, fontWeight: 'bold', textAlign: 'right', flex: 1, marginLeft: 20 },
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
    successDetail: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 40 },
    outlineBtn: { width: '100%', height: 60, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    outlineBtnText: { color: '#1e293b', fontWeight: 'bold' },
});
