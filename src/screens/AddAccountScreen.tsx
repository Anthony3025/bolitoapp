import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
    Modal,
    FlatList,
    Dimensions
} from 'react-native';
import { ArrowLeft, Landmark, ChevronRight, Check, CheckCircle2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { usePaymentStore } from '../store/paymentStore';

const BANKS = [
    { id: '1', name: 'Banco Unión', color: '#004a99' },
    { id: '2', name: 'Banco Mercantil Santa Cruz', color: '#0072bc' },
    { id: '3', name: 'Banco Nacional de Bolivia', color: '#003366' },
    { id: '4', name: 'Banco BISA', color: '#009145' },
    { id: '5', name: 'Banco de Crédito BCP', color: '#102d69' },
    { id: '6', name: 'Banco Ganadero', color: '#c8102e' },
    { id: '7', name: 'Banco Económico', color: '#0055a4' },
    { id: '8', name: 'Banco Sol', color: '#f39200' },
];

export default function AddAccountScreen({ navigation }: any) {
    const brandBlue = '#0026e3';
    const addAccount = usePaymentStore((state) => state.addAccount);

    const [selectedBank, setSelectedBank] = React.useState<any>(null);
    const [number, setNumber] = React.useState('');
    const [holderName, setHolderName] = React.useState('');
    const [showBankModal, setShowBankModal] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);

    const handleSave = () => {
        if (!selectedBank || !number || !holderName) {
            Alert.alert("Error", "Completa todos los campos");
            return;
        }

        addAccount({
            bankName: selectedBank.name,
            accountType: 'Cuenta Bancaria',
            accountNumber: '...' + number.slice(-4),
            accountHolder: holderName
        });

        setShowSuccess(true);
    };

    const BankSelectorModal = () => (
        <Modal visible={showBankModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Selecciona un banco</Text>
                        <TouchableOpacity onPress={() => setShowBankModal(false)}>
                            <Text style={styles.closeText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={BANKS}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.bankItem}
                                onPress={() => {
                                    setSelectedBank(item);
                                    setShowBankModal(false);
                                }}
                            >
                                <View style={[styles.bankLogo, { backgroundColor: `${item.color}15` }]}>
                                    <Landmark color={item.color} size={22} />
                                </View>
                                <Text style={styles.bankName}>{item.name}</Text>
                                {selectedBank?.id === item.id && <Check color={brandBlue} size={20} />}
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.divider} />}
                        showsVerticalScrollIndicator={false}
                    />
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
            <View style={styles.successModalOverlay}>
                <View style={styles.successModalContent}>
                    <View style={styles.successIconWrapper}>
                        <CheckCircle2 color="white" size={40} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.successTitleText}>¡Listo!</Text>
                    <Text style={styles.successSubtitle}>La cuenta bancaria ha sido configurada correctamente.</Text>
                    <TouchableOpacity
                        style={styles.successModalButton}
                        onPress={() => {
                            setShowSuccess(false);
                        }}
                    >
                        <Text style={styles.successModalButtonText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <BankSelectorModal />
            <SuccessModal />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={brandBlue} size={26} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agregar cuenta bancaria</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.iconCircle}>
                    <Landmark color={brandBlue} size={32} />
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Banco</Text>
                    <TouchableOpacity
                        style={styles.selectorInput}
                        onPress={() => setShowBankModal(true)}
                    >
                        {selectedBank ? (
                            <View style={styles.selectedBankContainer}>
                                <View style={[styles.smallLogo, { backgroundColor: `${selectedBank.color}15` }]}>
                                    <Landmark color={selectedBank.color} size={16} />
                                </View>
                                <Text style={styles.selectedBankText}>{selectedBank.name}</Text>
                            </View>
                        ) : (
                            <Text style={styles.placeholderText}>Selecciona tu banco</Text>
                        )}
                        <ChevronRight color="#94a3b8" size={20} />
                    </TouchableOpacity>

                    <Text style={styles.label}>Nombre del Titular</Text>
                    <TextInput
                        placeholder="Nombre completo"
                        style={styles.input}
                        value={holderName}
                        onChangeText={setHolderName}
                        placeholderTextColor="#94a3b8"
                    />

                    <Text style={styles.label}>Número de Cuenta</Text>
                    <TextInput
                        placeholder="000-000000-0"
                        style={styles.input}
                        keyboardType="numeric"
                        value={number}
                        onChangeText={setNumber}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Agregar cuenta bancaria</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    content: { flex: 1, padding: 20 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 30, marginTop: 10 },
    form: { marginBottom: 30 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 10, marginLeft: 4 },
    input: { backgroundColor: '#f8fafc', height: 56, borderRadius: 16, paddingHorizontal: 15, fontSize: 16, marginBottom: 25, borderWidth: 1, borderColor: '#f1f5f9', color: '#0f172a' },
    selectorInput: { backgroundColor: '#f8fafc', height: 56, borderRadius: 16, paddingHorizontal: 15, marginBottom: 25, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    placeholderText: { color: '#94a3b8', fontSize: 16 },
    selectedBankContainer: { flexDirection: 'row', alignItems: 'center' },
    smallLogo: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    selectedBankText: { fontSize: 16, color: '#0f172a', fontWeight: '500' },
    saveButton: { backgroundColor: '#0026e3', height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 40, shadowColor: '#0026e3', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
    saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, maxHeight: Dimensions.get('window').height * 0.7 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    closeText: { color: '#0026e3', fontWeight: 'bold' },
    bankItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
    bankLogo: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    bankName: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1e293b' },
    divider: { height: 1, backgroundColor: '#f1f5f9' },
    // Success Modal Styles
    successModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    successModalContent: {
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
    successTitleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 12,
    },
    successSubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    successModalButton: {
        backgroundColor: '#f1f5f9',
        height: 54,
        width: '100%',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
});
