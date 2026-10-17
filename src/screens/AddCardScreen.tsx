import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    Dimensions
} from 'react-native';
import { ArrowLeft, CreditCard, Scan, X, CheckCircle2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { usePaymentStore } from '../store/paymentStore';
import { Camera, CameraView } from 'expo-camera';

export default function AddCardScreen({ navigation }: any) {
    const brandBlue = '#0026e3';
    const addCard = usePaymentStore((state) => state.addCard);

    const [number, setNumber] = React.useState('');
    const [expiry, setExpiry] = React.useState('');
    const [cvv, setCvv] = React.useState('');
    const [name, setName] = React.useState('');
    const [isScanning, setIsScanning] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleNumberChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        setNumber(formatted);
    };

    const handleExpiryChange = (text: string) => {
        let cleaned = text.replace(/\D/g, '');
        if (cleaned.length > 2) {
            cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        setExpiry(cleaned);
    };

    const handleSimulateScan = () => {
        setIsScanning(false);
        setNumber('4532 8812 9901 2345');
        setExpiry('12/28');
        setShowSuccess(true);
    };

    const handleSave = () => {
        const rawNumber = number.replace(/\s/g, '');
        if (rawNumber.length < 16 || expiry.length < 5 || cvv.length < 3 || !name) {
            Alert.alert("Error", "Por favor completa todos los campos correctamente");
            return;
        }

        addCard({
            type: rawNumber.startsWith('4') ? 'Visa' : 'Mastercard',
            brand: 'Billetera Bolito',
            last4: rawNumber.slice(-4)
        });

        setShowSuccess(true);
    };

    const ScannerModal = () => (
        <Modal
            visible={isScanning}
            animationType="slide"
            transparent={false}
        >
            <View style={styles.scannerContainer}>
                {hasPermission ? (
                    <CameraView style={StyleSheet.absoluteFill} facing="back" />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: 'white' }}>Solicitando acceso a la cámara...</Text>
                    </View>
                )}

                {/* Overlay Mask */}
                <View style={styles.overlay}>
                    <View style={styles.unfocusedContainer}></View>
                    <View style={styles.focusedRow}>
                        <View style={styles.unfocusedContainer}></View>
                        <View style={styles.focusedContainer}>
                            {/* Corner Borders */}
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                        <View style={styles.unfocusedContainer}></View>
                    </View>
                    <View style={styles.unfocusedContainer}>
                        <Text style={styles.scanInstruction}>
                            Encuadra el frente de tu tarjeta
                        </Text>
                    </View>
                </View>

                {/* Header Actions */}
                <View style={styles.scannerHeader}>
                    <TouchableOpacity
                        style={styles.closeScanner}
                        onPress={() => setIsScanning(false)}
                    >
                        <X color="white" size={28} />
                    </TouchableOpacity>
                </View>

                {/* Bottom Simulation Button */}
                <View style={styles.scannerFooter}>
                    <TouchableOpacity
                        style={styles.simulateBtn}
                        onPress={handleSimulateScan}
                    >
                        <Scan color="white" size={20} style={{ marginRight: 10 }} />
                        <Text style={styles.simulateBtnText}>Simular Escaneo</Text>
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
                    <Text style={styles.modalSubtitle}>La tarjeta ha sido procesada correctamente.</Text>
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => {
                            setShowSuccess(false);
                        }}
                    >
                        <Text style={styles.modalButtonText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="dark" />
            <ScannerModal />
            <SuccessModal />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={brandBlue} size={26} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agregar Tarjeta</Text>
                <TouchableOpacity onPress={() => setIsScanning(true)} style={styles.scanButton}>
                    <Scan color={brandBlue} size={24} strokeWidth={2} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.cardPreview}>
                    <View style={styles.previewTop}>
                        <CreditCard color="white" size={36} />
                    </View>
                    <Text style={styles.previewNumber}>
                        {number || '**** **** **** ****'}
                    </Text>
                    <View style={styles.previewBottom}>
                        <View>
                            <Text style={styles.previewLabel}>TITULAR</Text>
                            <Text style={styles.previewName}>{name || 'NOMBRE COMPLETO'}</Text>
                        </View>
                        <View>
                            <Text style={styles.previewLabel}>EXPIRA</Text>
                            <Text style={styles.previewExpiry}>{expiry || 'MM/AA'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Número de Tarjeta</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="0000 0000 0000 0000"
                            style={styles.input}
                            keyboardType="numeric"
                            maxLength={19}
                            value={number}
                            onChangeText={handleNumberChange}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <Text style={styles.label}>Nombre en la Tarjeta</Text>
                    <TextInput
                        placeholder="Nombre completo"
                        style={styles.input}
                        value={name}
                        autoCapitalize="characters"
                        onChangeText={setName}
                        placeholderTextColor="#94a3b8"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={styles.label}>Expiración</Text>
                            <TextInput
                                placeholder="MM/AA"
                                style={styles.input}
                                maxLength={5}
                                keyboardType="numeric"
                                value={expiry}
                                onChangeText={handleExpiryChange}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                        <View style={{ width: 120 }}>
                            <Text style={styles.label}>CVV</Text>
                            <TextInput
                                placeholder="000"
                                style={styles.input}
                                maxLength={3}
                                keyboardType="numeric"
                                secureTextEntry
                                value={cvv}
                                onChangeText={setCvv}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Guardar tarjeta</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
    scanButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    content: { flex: 1, padding: 20 },
    cardPreview: { backgroundColor: '#0026e3', height: 210, borderRadius: 28, padding: 25, justifyContent: 'space-between', marginBottom: 30, shadowColor: '#0026e3', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 12 },
    previewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    previewNumber: { color: 'white', fontSize: 24, letterSpacing: 3, fontWeight: 'bold', marginTop: 10, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    previewBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    previewLabel: { color: 'white', fontSize: 10, opacity: 0.7, marginBottom: 4, letterSpacing: 1 },
    previewName: { color: 'white', fontSize: 15, fontWeight: '600', textTransform: 'uppercase' },
    previewExpiry: { color: 'white', fontSize: 15, fontWeight: '600' },
    form: { marginBottom: 30 },
    label: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#f8fafc', height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', color: '#0f172a', fontWeight: '500' },
    inputWrapper: { position: 'relative' },
    row: { flexDirection: 'row' },
    saveButton: { backgroundColor: '#0026e3', height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#0026e3', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    // Scanner Styles
    scannerContainer: { flex: 1, backgroundColor: 'black' },
    scannerHeader: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'flex-end' },
    closeScanner: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    focusedRow: { flexDirection: 'row', height: 200 },
    focusedContainer: { width: Dimensions.get('window').width - 40, position: 'relative' },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: 'white' },
    topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
    topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
    scanInstruction: { color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: -40 },
    scannerFooter: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
    simulateBtn: { backgroundColor: '#0026e3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 18, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
    simulateBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    // Custom Success Modal Styles
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
