import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Lightbulb, Droplets, Globe, Smartphone, Book, Check, X, Search, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'luz', name: 'Luz', icon: Lightbulb, color: '#eab308', bg: '#fefce8' },
    { id: 'agua', name: 'Agua', icon: Droplets, color: '#3b82f6', bg: '#eff6ff' },
    { id: 'internet', name: 'Internet', icon: Globe, color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 'tele', name: 'Telefonía', icon: Smartphone, color: '#ec4899', bg: '#fdf2f8' },
    { id: 'educ', name: 'Educación', icon: Book, color: '#10b981', bg: '#ecfdf5' },
];

const OPERATORS = {
    luz: [{ id: 'cre', name: 'CRE S.A.' }, { id: 'delapaz', name: 'DELAPAZ' }, { id: 'elfec', name: 'ELFEC' }],
    agua: [{ id: 'saguapac', name: 'SAGUAPAC' }, { id: 'epsas', name: 'EPSAS' }],
    internet: [{ id: 'entel', name: 'ENTEL Fibra' }, { id: 'tigo', name: 'Tigo Home' }, { id: 'viva', name: 'AXS Internet' }],
};

export default function PayServicesScreen({ navigation }: any) {
    const [step, setStep] = useState(1); // 1: Category, 2: Operator, 3: Form, 4: Confirm, 5: Success
    const [selectedCat, setSelectedCat] = useState<any>(null);
    const [selectedOp, setSelectedOp] = useState<any>(null);
    const [clientCode, setClientCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [debt, setDebt] = useState<any>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [step]);

    const handleSelectCat = (cat: any) => {
        setSelectedCat(cat);
        setStep(2);
    };

    const handleSelectOp = (op: any) => {
        setSelectedOp(op);
        setStep(3);
    };

    const handleVerify = () => {
        if (!clientCode) return;
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            setDebt({ amount: 154.50, month: 'Enero 2026', limitDate: '28/01/2026' });
            setStep(4);
        }, 1500);
    };

    const handlePay = () => {
        setStep(5);
    };

    const renderStep1 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>¿Qué servicio quieres pagar?</Text>
            <View style={styles.grid}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity key={cat.id} style={styles.catCard} onPress={() => handleSelectCat(cat)}>
                        <View style={[styles.catIconBox, { backgroundColor: cat.bg }]}>
                            <cat.icon size={32} color={cat.color} />
                        </View>
                        <Text style={styles.catName}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Selecciona la empresa</Text>
            <ScrollView>
                {(OPERATORS as any)[selectedCat?.id || 'luz']?.map((op: any) => (
                    <TouchableOpacity key={op.id} style={styles.opItem} onPress={() => handleSelectOp(op)}>
                        <Text style={styles.opName}>{op.name}</Text>
                        <ArrowRight size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </Animated.View>
    );

    const renderStep3 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>{selectedOp?.name}</Text>
            </View>
            <Text style={styles.sectionTitle}>Ingresa tu Código de Cliente</Text>
            <TextInput
                style={styles.input}
                placeholder="Ej. 1234567"
                value={clientCode}
                onChangeText={setClientCode}
                keyboardType="numeric"
                autoFocus
            />
            <Text style={styles.hint}>Lo encontrarás en tu factura física o digital.</Text>
            <TouchableOpacity
                style={[styles.mainBtn, !clientCode && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={!clientCode || isVerifying}
            >
                <Text style={styles.mainBtnText}>{isVerifying ? 'CONSULTANDO DEUDA...' : 'CONTINUAR'}</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep4 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Confirmar Pago</Text>
            <View style={styles.debtCard}>
                <Text style={styles.debtLabel}>Monto a pagar</Text>
                <Text style={styles.debtAmount}>Bs. {debt?.amount.toFixed(2)}</Text>
                <View style={styles.divider} />
                <View style={styles.debtRow}>
                    <Text style={styles.rowLabel}>Periodo:</Text>
                    <Text style={styles.rowValue}>{debt?.month}</Text>
                </View>
                <View style={styles.debtRow}>
                    <Text style={styles.rowLabel}>Vencimiento:</Text>
                    <Text style={styles.rowValue}>{debt?.limitDate}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.mainBtn} onPress={handlePay}>
                <Text style={styles.mainBtnText}>PAGAR AHORA</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep5 = () => (
        <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
            <View style={styles.successIcon}>
                <Check size={50} color="white" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>¡Pago Exitoso!</Text>
            <Text style={styles.successDetail}>Tu servicio de {selectedCat?.name} ha sido pagado.</Text>
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
                <Text style={styles.headerTitle}>Pagar Servicios</Text>
                <View style={{ width: 28 }} />
            </LinearGradient>
            <View style={styles.content}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
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
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    catCard: { width: (width - 55) / 2, backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
    catIconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    catName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    opItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    opName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    infoBadge: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 15 },
    infoBadgeText: { color: '#0026e3', fontWeight: 'bold', fontSize: 12 },
    input: { backgroundColor: 'white', height: 65, borderRadius: 18, paddingHorizontal: 20, fontSize: 18, fontWeight: 'bold', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
    hint: { fontSize: 13, color: '#64748b', marginLeft: 5 },
    spacer: { flex: 1 },
    mainBtn: { backgroundColor: '#0026e3', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 40, marginBottom: 20 },
    btnDisabled: { backgroundColor: '#cbd5e1' },
    mainBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    debtCard: { backgroundColor: 'white', borderRadius: 25, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
    debtLabel: { fontSize: 14, color: '#64748b', marginBottom: 8 },
    debtAmount: { fontSize: 36, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
    divider: { width: '100%', height: 1, backgroundColor: '#f1f5f9', marginBottom: 20 },
    debtRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
    rowLabel: { color: '#94a3b8' },
    rowValue: { fontWeight: 'bold', color: '#1e293b' },
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
    successDetail: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 40 },
    outlineBtn: { width: '100%', height: 60, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    outlineBtnText: { color: '#1e293b', fontWeight: 'bold' },
});
