import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Check, Smartphone, User } from 'lucide-react-native';

const OPERATORS = [
    { id: 'entel', name: 'ENTEL', color: '#0047bb', bg: '#eff6ff' },
    { id: 'tigo', name: 'TIGO', color: '#0033a0', bg: '#e0e7ff' },
    { id: 'viva', name: 'VIVA', color: '#74c92c', bg: '#f0fdf4' },
];

const AMOUNTS = ['10', '20', '30', '50', '100'];

export default function PhoneRechargeScreen({ navigation }: any) {
    const [step, setStep] = useState(1); // 1: Form, 2: Confirm, 3: Success
    const [phone, setPhone] = useState('');
    const [selectedOp, setSelectedOp] = useState(OPERATORS[0]);
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    }, [step]);

    const handleContinue = () => {
        if (phone.length < 8 || !amount) return;
        setStep(2);
    };

    const handleRecharge = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setStep(3);
        }, 2000);
    };

    const renderStep1 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>¿Qué número recargamos?</Text>
            <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                    <Smartphone size={20} color="#64748b" style={{ marginRight: 12 }} />
                    <TextInput
                        style={styles.phoneInput}
                        placeholder="Número de celular"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        maxLength={8}
                    />
                    <TouchableOpacity style={styles.contactIcon}>
                        <User size={20} color="#0026e3" />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.subTitle}>Empresa telefónica</Text>
            <View style={styles.operatorRow}>
                {OPERATORS.map((op) => (
                    <TouchableOpacity
                        key={op.id}
                        style={[styles.opBadge, selectedOp.id === op.id && { borderColor: op.color, backgroundColor: op.bg }]}
                        onPress={() => setSelectedOp(op)}
                    >
                        <Text style={[styles.opBadgeText, { color: selectedOp.id === op.id ? op.color : '#94a3b8' }]}>{op.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.subTitle}>Monto de recarga (Bs.)</Text>
            <View style={styles.amountsGrid}>
                {AMOUNTS.map((amt) => (
                    <TouchableOpacity
                        key={amt}
                        style={[styles.amtChip, amount === amt && styles.amtChipActive]}
                        onPress={() => setAmount(amt)}
                    >
                        <Text style={[styles.amtText, amount === amt && styles.amtTextActive]}>{amt}</Text>
                    </TouchableOpacity>
                ))}
            </View>


            <TouchableOpacity
                style={[styles.mainBtn, (phone.length < 8 || !amount) && styles.btnDisabled]}
                onPress={handleContinue}
                disabled={phone.length < 8 || !amount}
            >
                <Text style={styles.mainBtnText}>CONTINUAR</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Revisa los detalles</Text>
            <View style={styles.confirmCard}>
                <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Celular</Text>
                    <Text style={styles.confirmValue}>{phone}</Text>
                </View>
                <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Operador</Text>
                    <Text style={[styles.confirmValue, { color: selectedOp.color }]}>{selectedOp.name}</Text>
                </View>
                <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Monto</Text>
                    <Text style={styles.confirmValue}>Bs. {amount}.00</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.mainBtn} onPress={handleRecharge} disabled={isLoading}>
                <Text style={styles.mainBtnText}>{isLoading ? 'RECARGANDO...' : 'CONFIRMAR RECARGA'}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep3 = () => (
        <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
            <View style={styles.successIcon}>
                <Check size={50} color="white" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>¡Recarga Exitosa!</Text>
            <Text style={styles.successDetail}>Se ha acreditado Bs. {amount} al número {phone}.</Text>
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
                <Text style={styles.headerTitle}>Recarga Celular</Text>
                <View style={{ width: 28 }} />
            </LinearGradient>
            <View style={styles.content}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
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
    inputCard: { backgroundColor: 'white', borderRadius: 18, paddingHorizontal: 20, height: 65, justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 30 },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    phoneInput: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    contactIcon: { padding: 5 },
    subTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 15, textTransform: 'uppercase' },
    operatorRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
    opBadge: { flex: 1, height: 50, borderRadius: 15, borderWidth: 1.5, borderColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    opBadgeText: { fontWeight: 'bold', fontSize: 14 },
    amountsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    amtChip: { width: '30%', height: 60, borderRadius: 15, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
    amtChipActive: { backgroundColor: '#0026e3', borderColor: '#0026e3' },
    amtText: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
    amtTextActive: { color: 'white' },
    spacer: { flex: 1 },
    mainBtn: { backgroundColor: '#0026e3', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 40, marginBottom: 20 },
    btnDisabled: { backgroundColor: '#cbd5e1' },
    mainBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    confirmCard: { backgroundColor: 'white', borderRadius: 25, padding: 25, borderWidth: 1, borderColor: '#f1f5f9' },
    confirmRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
    confirmLabel: { color: '#94a3b8', fontSize: 14 },
    confirmValue: { color: '#1e293b', fontSize: 16, fontWeight: 'bold' },
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
    successDetail: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 40 },
    outlineBtn: { width: '100%', height: 60, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    outlineBtnText: { color: '#1e293b', fontWeight: 'bold' },
});
