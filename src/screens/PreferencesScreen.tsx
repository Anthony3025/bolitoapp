import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal
} from 'react-native';
import { ArrowLeft, Globe, Moon, Trash2, Shield, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../store/settingsStore';

export default function PreferencesScreen({ navigation }: any) {
    const brandBlue = '#0026e3';
    const { language, setLanguage, theme, setTheme } = useSettingsStore();

    const [showSuccess, setShowSuccess] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [isCleaning, setIsCleaning] = React.useState(false);

    const handleClearCache = () => {
        setShowConfirm(true);
    };

    const confirmClear = () => {
        setShowConfirm(false);
        setIsCleaning(true);
        // Simular limpieza
        setTimeout(() => {
            setIsCleaning(false);
            setShowSuccess(true);
        }, 1500);
    };

    const SuccessModal = () => (
        <Modal visible={showSuccess} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.successIconWrapper}>
                        <CheckCircle2 color="white" size={40} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.modalTitle}>¡Limpieza completa!</Text>
                    <Text style={styles.modalSubtitle}>La caché ha sido liberada correctamente. Se han recuperado 12.4 MB.</Text>
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

    const ConfirmModal = () => (
        <Modal visible={showConfirm} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={[styles.successIconWrapper, { backgroundColor: '#ef4444' }]}>
                        <AlertTriangle color="white" size={40} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.modalTitle}>¿Estás seguro?</Text>
                    <Text style={styles.modalSubtitle}>Se borrarán los archivos temporales de la aplicación para liberar espacio.</Text>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: '#f8fafc', width: '45%', marginBottom: 0 }]}
                            onPress={() => setShowConfirm(false)}
                        >
                            <Text style={[styles.modalButtonText, { color: '#64748b' }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: '#ef4444', width: '45%', marginBottom: 0 }]}
                            onPress={confirmClear}
                        >
                            <Text style={[styles.modalButtonText, { color: 'white' }]}>Limpiar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const PreferenceItem = ({ icon: Icon, title, subtitle, onPress, destructive }: any) => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: destructive ? '#fef2f2' : `${brandBlue}10` }]}>
                <Icon color={destructive ? '#ef4444' : brandBlue} size={22} />
            </View>
            <View style={styles.itemText}>
                <Text style={[styles.itemTitle, destructive && { color: '#ef4444' }]}>{title}</Text>
                <Text style={styles.itemSubtitle}>{subtitle}</Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SuccessModal />
            <ConfirmModal />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color={brandBlue} size={26} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Preferencias</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionLabel}>General</Text>
                <View style={styles.section}>
                    <PreferenceItem
                        icon={Globe}
                        title="Idioma"
                        subtitle={language === 'es' ? 'Español (BO)' : 'English (US)'}
                        onPress={() => setLanguage(language === 'es' ? 'en' : 'es')}
                    />
                    <View style={styles.divider} />
                    <PreferenceItem
                        icon={Moon}
                        title="Apariencia"
                        subtitle={theme === 'system' ? 'Seguir sistema' : theme === 'dark' ? 'Oscuro' : 'Claro'}
                        onPress={() => setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')}
                    />
                </View>

                <Text style={styles.sectionLabel}>Privacidad</Text>
                <View style={styles.section}>
                    <PreferenceItem
                        icon={Shield}
                        title="Permisos"
                        subtitle="GPS, Cámara y Contactos"
                        onPress={() => Alert.alert("Gestionar Permisos", "Ve a los ajustes de tu teléfono para gestionar los permisos de Bolito.")}
                    />
                </View>

                <Text style={styles.sectionLabel}>Mantenimiento</Text>
                <View style={styles.section}>
                    <PreferenceItem
                        icon={Trash2}
                        title={isCleaning ? "Limpiando..." : "Limpiar Caché"}
                        subtitle="Libera 12.4 MB"
                        onPress={handleClearCache}
                        destructive={true}
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
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        backgroundColor: '#f1f5f9',
        height: 54,
        width: '100%',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
});
