import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Modal
} from 'react-native';
import { ArrowLeft, ShieldCheck, Fingerprint, Lock, Key, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../store/settingsStore';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SecurityScreen({ navigation }: any) {
    const brandBlue = '#0026e3';
    const { biometricsEnabled, toggleBiometrics, twoFactorEnabled, toggleTwoFactor } = useSettingsStore();
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [successMsg, setSuccessMsg] = React.useState('');

    const handleBiometricToggle = async (newValue: boolean) => {
        if (newValue) {
            // Validar antes de activar
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                Alert.alert("No compatible", "Tu dispositivo no admite biometría o no tiene huellas/rostros registrados.");
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirma tu identidad para activar la biometría',
                fallbackLabel: 'Usar PIN',
            });

            if (result.success) {
                toggleBiometrics();
                setSuccessMsg('Biometría activada correctamente');
                setShowSuccess(true);
            }
        } else {
            // Desactivar libremente
            toggleBiometrics();
        }
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
                    <Text style={styles.modalTitle}>¡Configurado!</Text>
                    <Text style={styles.modalSubtitle}>{successMsg}</Text>
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => setShowSuccess(false)}
                    >
                        <Text style={styles.modalButtonText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const SecurityItem = ({ icon: Icon, title, subtitle, hasSwitch, value, onToggle, onPress }: any) => (
        <TouchableOpacity
            style={styles.item}
            onPress={onPress}
            disabled={hasSwitch}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${brandBlue}10` }]}>
                <Icon color={brandBlue} size={22} />
            </View>
            <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemSubtitle}>{subtitle}</Text>
            </View>
            {hasSwitch ? (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#e2e8f0', true: `${brandBlue}40` }}
                    thumbColor={value ? brandBlue : '#f1f5f9'}
                />
            ) : (
                <ChevronRight color="#94a3b8" size={20} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SuccessModal />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color={brandBlue} size={26} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seguridad</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <View style={styles.shieldWrapper}>
                            <ShieldCheck color="white" size={32} />
                        </View>
                        <View>
                            <Text style={styles.statusTitle}>Tu cuenta está protegida</Text>
                            <Text style={styles.statusSubtitle}>Último acceso: Hoy, 14:02</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionLabel}>Acceso</Text>
                <View style={styles.section}>
                    <SecurityItem
                        icon={Fingerprint}
                        title="Biometría"
                        subtitle="Usar Huella o FaceID"
                        hasSwitch={true}
                        value={biometricsEnabled}
                        onToggle={handleBiometricToggle}
                    />
                    <View style={styles.divider} />
                    <SecurityItem
                        icon={Lock}
                        title="Cambiar PIN"
                        subtitle="PIN de 4 dígitos para pagos"
                        onPress={() => navigation.navigate('ChangePin')}
                    />
                </View>

                <Text style={styles.sectionLabel}>Avanzado</Text>
                <View style={styles.section}>
                    <SecurityItem
                        icon={ShieldCheck}
                        title="Autenticación 2FA"
                        subtitle="Doble factor de seguridad"
                        hasSwitch={true}
                        value={twoFactorEnabled}
                        onToggle={toggleTwoFactor}
                    />
                </View>
            </ScrollView>
        </View>
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
    statusCard: {
        backgroundColor: '#0026e3',
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shieldWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    statusTitle: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },
    statusSubtitle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 13,
        marginTop: 2,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    section: {
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 8,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemText: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    itemSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 15,
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
