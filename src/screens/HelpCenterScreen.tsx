import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput
} from 'react-native';
import { ArrowLeft, Search, MessageSquare, Phone, Mail, ChevronRight, HelpCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function HelpCenterScreen({ navigation }: any) {
    const brandBlue = '#0026e3';

    const CategoryItem = ({ title, icon: Icon }: any) => (
        <TouchableOpacity style={styles.categoryCard}>
            <View style={[styles.catIcon, { backgroundColor: `${brandBlue}10` }]}>
                <Icon color={brandBlue} size={24} />
            </View>
            <Text style={styles.catTitle}>{title}</Text>
        </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Centro de Ayuda</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.searchSection}>
                    <Text style={styles.heroTitle}>¿Cómo podemos ayudarte?</Text>
                    <View style={styles.searchBar}>
                        <Search color="#94a3b8" size={20} />
                        <TextInput
                            placeholder="Buscar ayuda..."
                            style={styles.searchInput}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>

                <View style={styles.categoriesGrid}>
                    <CategoryItem title="Pagos" icon={HelpCircle} />
                    <CategoryItem title="Cuenta" icon={HelpCircle} />
                    <CategoryItem title="Seguridad" icon={HelpCircle} />
                    <CategoryItem title="Tarjetas" icon={HelpCircle} />
                </View>

                <Text style={styles.sectionLabel}>Contacto Directo</Text>
                <View style={styles.contactSection}>
                    <TouchableOpacity style={styles.contactItem}>
                        <View style={[styles.contactIcon, { backgroundColor: '#dcfce7' }]}>
                            <MessageSquare color="#16a34a" size={22} />
                        </View>
                        <View style={styles.contactText}>
                            <Text style={styles.contactTitle}>WhatsApp</Text>
                            <Text style={styles.contactSubtitle}>Respuesta inmediata</Text>
                        </View>
                        <ChevronRight color="#94a3b8" size={20} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.contactItem}>
                        <View style={[styles.contactIcon, { backgroundColor: '#f0f4ff' }]}>
                            <Phone color={brandBlue} size={22} />
                        </View>
                        <View style={styles.contactText}>
                            <Text style={styles.contactTitle}>Llamada</Text>
                            <Text style={styles.contactSubtitle}>Soporte 24/7</Text>
                        </View>
                        <ChevronRight color="#94a3b8" size={20} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
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
    searchSection: {
        marginBottom: 30,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 15,
        letterSpacing: -0.5,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 56,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#1e293b',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    categoryCard: {
        width: '47%',
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 20,
        marginBottom: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    catIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    catTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 15,
        marginLeft: 4,
    },
    contactSection: {
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    contactIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contactText: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    contactSubtitle: {
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
