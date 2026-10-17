import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    LayoutAnimation,
    Platform,
    UIManager,
    Modal
} from 'react-native';
import { ArrowLeft, Lock, CheckCircle2, AlertTriangle, Delete } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ChangePinScreen({ navigation }: any) {
    const brandBlue = '#0026e3';
    const [step, setStep] = React.useState(1); // 1: Current, 2: New, 3: Confirm
    const [pin, setPin] = React.useState('');
    const [newPin, setNewPin] = React.useState('');
    const [confirmPin, setConfirmPin] = React.useState('');
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [showError, setShowError] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState('');
    const [flashVisible, setFlashVisible] = React.useState(false);
    const [flashMessage, setFlashMessage] = React.useState('');

    const triggerFlash = (message: string, nextStepAction: () => void) => {
        setFlashMessage(message);
        setFlashVisible(true);
        setTimeout(() => {
            setFlashVisible(false);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            nextStepAction();
        }, 800);
    };

    const handleNumberPress = (num: number) => {
        let current = '';
        if (step === 1) current = pin;
        if (step === 2) current = newPin;
        if (step === 3) current = confirmPin;

        if (current.length < 4) {
            const updated = current + num;
            if (step === 1) setPin(updated);
            if (step === 2) setNewPin(updated);
            if (step === 3) setConfirmPin(updated);

            if (updated.length === 4) {
                if (step === 1) {
                    if (updated === '1234') {
                        triggerFlash("PIN Correcto", () => setStep(2));
                    } else {
                        setErrorMsg("El PIN actual que ingresaste es incorrecto.");
                        setShowError(true);
                        setPin('');
                    }
                } else if (step === 2) {
                    triggerFlash("Nuevo PIN listo", () => setStep(3));
                } else if (step === 3) {
                    if (updated === newPin) {
                        triggerFlash("PIN Actualizado", () => setShowSuccess(true));
                    } else {
                        setErrorMsg("Los PINs no coinciden. Intenta configurarlo de nuevo.");
                        setShowError(true);
                        setConfirmPin('');
                    }
                }
            }
        }
    };

    const handleDelete = () => {
        if (step === 1) setPin(pin.slice(0, -1));
        if (step === 2) setNewPin(newPin.slice(0, -1));
        if (step === 3) setConfirmPin(confirmPin.slice(0, -1));
    };

    const getTitle = () => {
        if (step === 1) return "Ingresa tu PIN actual";
        if (step === 2) return "Ingresa tu nuevo PIN";
        return "Confirma tu nuevo PIN";
    };

    const dots = Array(4).fill(0);
    const activePin = step === 1 ? pin : step === 2 ? newPin : confirmPin;

    const FlashOverlay = () => (
        <Modal visible={flashVisible} transparent animationType="fade">
            <View style={styles.flashOverlay}>
                <View style={styles.flashCard}>
                    <View style={styles.flashIconCircle}>
                        <CheckCircle2 color="white" size={48} strokeWidth={3} />
                    </View>
                    <Text style={styles.flashText}>{flashMessage}</Text>
                </View>
            </View>
        </Modal>
    );

    const ErrorModal = () => (
        <Modal
            visible={showError}
            transparent={true}
            animationType="fade"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={[styles.successIconWrapper, { backgroundColor: '#ef4444' }]}>
                        <AlertTriangle color="white" size={40} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.modalTitle}>Error</Text>
                    <Text style={styles.modalSubtitle}>{errorMsg}</Text>
                    <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: '#fef2f2' }]}
                        onPress={() => setShowError(false)}
                    >
                        <Text style={[styles.modalButtonText, { color: '#ef4444' }]}>Intentar de nuevo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const SuccessModal = () => (
        <Modal
            visible={showSuccess}
            transparent={true}
            animationType="fade"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.successIconWrapper}>
                        <CheckCircle2 color="white" size={40} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.modalTitle}>¡Listo!</Text>
                    <Text style={styles.modalSubtitle}>Tu PIN de seguridad ha sido actualizado correctamente.</Text>
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => {
                            setShowSuccess(false);
                            navigation.goBack();
                        }}
                    >
                        <Text style={styles.modalButtonText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SuccessModal />
            <ErrorModal />
            <FlashOverlay />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={brandBlue} size={26} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cambiar PIN</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <View key={step} style={styles.stepContainer}>
                    <View style={styles.iconCircle}>
                        <Lock color={brandBlue} size={32} />
                    </View>
                    <Text style={styles.instruction}>{getTitle()}</Text>

                    <View style={styles.dotsContainer}>
                        {dots.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i < activePin.length && { backgroundColor: brandBlue, borderColor: brandBlue }
                                ]}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.keypad}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((key, i) => (
                        <View key={i} style={styles.keyWrapper}>
                            {key !== '' ? (
                                <TouchableOpacity
                                    style={[
                                        styles.keyCircle,
                                        key === 'del' && { backgroundColor: 'transparent' }
                                    ]}
                                    activeOpacity={0.6}
                                    onPress={() => {
                                        if (typeof key === 'number') handleNumberPress(key);
                                        if (key === 'del') handleDelete();
                                    }}
                                >
                                    {key === 'del' ? (
                                        <Delete color={brandBlue} size={28} />
                                    ) : (
                                        <Text style={styles.keyText}>{key}</Text>
                                    )}
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 50 },
    stepContainer: { alignItems: 'center', paddingTop: 40, width: '100%' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    instruction: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 30 },
    dotsContainer: { flexDirection: 'row', marginBottom: 20 },
    dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#e2e8f0', marginHorizontal: 12 },
    keypad: { flexDirection: 'row', flexWrap: 'wrap', width: '90%', justifyContent: 'center' },
    keyWrapper: { width: '33%', height: 95, justifyContent: 'center', alignItems: 'center' },
    keyCircle: { width: 75, height: 75, borderRadius: 37.5, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
    keyText: { fontSize: 26, fontWeight: '600', color: '#1e293b' },
    // Flash Overlay Styles
    flashOverlay: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center' },
    flashCard: { alignItems: 'center' },
    flashIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0026e3', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#0026e3', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
    flashText: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    modalContent: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    successIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0026e3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 12,
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    modalButton: {
        backgroundColor: '#f1f5f9',
        height: 54,
        width: '100%',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
});
