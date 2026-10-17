import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Alert,
    Platform,
    Modal,
    Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    User,
    ChevronRight,
    Settings,
    Shield,
    Bell,
    HelpCircle,
    LogOut,
    CreditCard,
    ArrowLeft,
    X
} from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
    const brandBlue = '#0026e3';

    React.useEffect(() => {
        console.log("ProfileScreen mounted");
    }, []);

    const handleLogout = () => {
        setShowLogoutModal(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    };

    const closeLogoutModal = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start(() => setShowLogoutModal(false));
    };

    const confirmLogout = () => {
        closeLogoutModal();
        setTimeout(() => {
            logout();
        }, 200);
    };

    const LogoutModal = () => (
        <Modal
            visible={showLogoutModal}
            transparent={true}
            animationType="none"
            onRequestClose={closeLogoutModal}
        >
            <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={closeLogoutModal}
                />
                <Animated.View style={[
                    styles.modalContent,
                    { transform: [{ scale: scaleAnim }] }
                ]}>
                    <View style={styles.logoutIconContainer}>
                        <LogOut color="#ef4444" size={32} strokeWidth={2.5} />
                    </View>

                    <Text style={styles.modalTitle}>¿Cerrar Sesión?</Text>
                    <Text style={styles.modalSubtitle}>
                        ¿Estás seguro que deseas salir de Bolito? Tendrás que ingresar tus credenciales nuevamente.
                    </Text>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={closeLogoutModal}
                        >
                            <Text style={styles.cancelBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.confirmLogoutBtn}
                            onPress={confirmLogout}
                        >
                            <Text style={styles.confirmLogoutBtnText}>Salir</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );

    const MenuItem = ({ icon: Icon, title, subtitle, onPress, color = brandBlue }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.menuIconContainer, { backgroundColor: `${color}10` }]}>
                <Icon color={color} size={22} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <ChevronRight color="#9ca3af" size={20} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <LogoutModal />

            {/* Header Ultra-Minimalista */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft color={brandBlue} size={26} strokeWidth={2} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Configuración</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.profileSummary}>
                    <Text style={styles.userName}>{user?.name || 'Usuario Bolito'}</Text>
                    <Text style={styles.userPhone}>{user?.phone || 'bolito.user@email.com'}</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mi Cuenta</Text>
                    <View style={styles.card}>
                        <MenuItem
                            icon={User}
                            title="Información Personal"
                            subtitle="Gestiona tus datos personales"
                            onPress={() => navigation.navigate('PersonalInfo')}
                        />
                        <View style={styles.divider} />
                        <MenuItem
                            icon={CreditCard}
                            title="Tarjetas y Cuentas"
                            subtitle="Métodos de pago guardados"
                            onPress={() => navigation.navigate('CardsAccounts')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Seguridad y Ajustes</Text>
                    <View style={styles.card}>
                        <MenuItem
                            icon={Shield}
                            title="Seguridad"
                            subtitle="PIN, Huella y privacidad"
                            onPress={() => navigation.navigate('Security')}
                        />
                        <View style={styles.divider} />
                        <MenuItem
                            icon={Bell}
                            title="Notificaciones"
                            subtitle="Alertas y mensajes"
                            onPress={() => navigation.navigate('NotificationsSettings')}
                        />
                        <View style={styles.divider} />
                        <MenuItem
                            icon={Settings}
                            title="Preferencias"
                            subtitle="Idioma y apariencia"
                            onPress={() => navigation.navigate('Preferences')}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Soporte</Text>
                    <View style={styles.card}>
                        <MenuItem
                            icon={HelpCircle}
                            title="Centro de Ayuda"
                            subtitle="Preguntas frecuentes y soporte"
                            onPress={() => navigation.navigate('HelpCenter')}
                        />
                    </View>
                </View>

                {/* Botón de Cierre de Sesión */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <LogOut color="#ef4444" size={22} style={{ marginRight: 10 }} />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Bolito v1.0.2 (Beta)</Text>

                {/* Spacer para TabBar */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContent: {
        paddingTop: 10,
    },
    header: {
        paddingTop: 55,
        paddingBottom: 15,
        backgroundColor: 'white',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 10,
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
        color: '#0f172a',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: -0.3,
    },
    profileSummary: {
        alignItems: 'center',
        marginTop: 0,
    },
    userName: {
        color: '#1e293b',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: -0.8,
    },
    userPhone: {
        color: '#64748b',
        fontSize: 15,
        marginTop: 4,
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 5,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 20,
    },
    // Logout Modal Styles
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
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 15,
    },
    logoutIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    modalActions: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#64748b',
    },
    confirmLogoutBtn: {
        flex: 1,
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ef4444',
    },
    confirmLogoutBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
});
