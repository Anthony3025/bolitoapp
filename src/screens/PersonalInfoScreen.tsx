import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal
} from 'react-native';
import { ArrowLeft, User, Smartphone, CheckCircle2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

const InfoField = ({ label, value, icon: Icon, brandBlue, editable = false, onChangeText }: any) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
            <View style={[styles.iconContainer, { backgroundColor: `${brandBlue}10` }]}>
                <Icon color={brandBlue} size={20} />
            </View>
            <TextInput
                style={[styles.input, !editable && styles.disabledInput]}
                value={value}
                editable={editable}
                onChangeText={onChangeText}
                placeholderTextColor="#94a3b8"
            />
        </View>
    </View>
);

export default function PersonalInfoScreen({ navigation }: any) {
    const { user, updateUser } = useAuthStore();
    const brandBlue = '#0026e3';

    const [name, setName] = React.useState(user?.name || '');
    const [isSaving, setIsSaving] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert("Error", "El nombre no puede estar vacío");
            return;
        }

        setIsSaving(true);
        // Simular guardado
        setTimeout(() => {
            updateUser({ name });
            setIsSaving(false);
            setShowSuccess(true);
        }, 800);
    };

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
                    <Text style={styles.successTitle}>¡Listo!</Text>
                    <Text style={styles.successSubtitle}>Tu información ha sido actualizada correctamente.</Text>
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
            <SuccessModal />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color={brandBlue} size={26} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Información Personal</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.infoSection}>
                    <InfoField
                        label="Nombre Completo"
                        value={name}
                        icon={User}
                        brandBlue={brandBlue}
                        editable={true}
                        onChangeText={setName}
                    />
                    <InfoField
                        label="Teléfono"
                        value={user?.phone || '+591 70000000'}
                        icon={Smartphone}
                        brandBlue={brandBlue}
                        editable={false}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    infoSection: {
        marginBottom: 30,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 54,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },
    disabledInput: {
        color: '#94a3b8',
    },
    saveButton: {
        backgroundColor: '#0026e3',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 40,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
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
    successTitle: {
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
