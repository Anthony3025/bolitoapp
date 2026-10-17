import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch
} from 'react-native';
import { ArrowLeft, Bell, Smartphone, Mail, DollarSign } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from '../store/settingsStore';

export default function NotificationsSettingsScreen({ navigation }: any) {
    const brandBlue = '#0026e3';
    const { notifications, toggleNotification } = useSettingsStore();

    const NotificationItem = ({ icon: Icon, title, subtitle, value, onToggle }: any) => (
        <View style={styles.item}>
            <View style={[styles.iconContainer, { backgroundColor: `${brandBlue}10` }]}>
                <Icon color={brandBlue} size={22} />
            </View>
            <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{title}</Text>
                <Text style={styles.itemSubtitle}>{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#e2e8f0', true: `${brandBlue}40` }}
                thumbColor={value ? brandBlue : '#f1f5f9'}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color={brandBlue} size={26} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionLabel}>Canales</Text>
                <View style={styles.section}>
                    <NotificationItem
                        icon={Smartphone}
                        title="Alertas Push"
                        subtitle="Notificaciones en tu pantalla"
                        value={notifications.push}
                        onToggle={() => toggleNotification('push')}
                    />
                    <View style={styles.divider} />
                    <NotificationItem
                        icon={Mail}
                        title="Resúmenes por Correo"
                        subtitle="Estado de cuenta mensual"
                        value={notifications.email}
                        onToggle={() => toggleNotification('email')}
                    />
                </View>

                <Text style={styles.sectionLabel}>Alertas de Actividad</Text>
                <View style={styles.section}>
                    <NotificationItem
                        icon={DollarSign}
                        title="Pagos y Cobros"
                        subtitle="Confirmación de transacciones"
                        value={notifications.transactions}
                        onToggle={() => toggleNotification('transactions')}
                    />
                    <View style={styles.divider} />
                    <NotificationItem
                        icon={Bell}
                        title="Promociones"
                        subtitle="Ofertas y novedades"
                        value={notifications.offers}
                        onToggle={() => toggleNotification('offers')}
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
});
