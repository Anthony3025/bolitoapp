import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MapPin, Search, Star } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

// El array POINTS ya no es necesario como fuente principal de verdad.
const FALLBACK_POINTS = [
    { id: '1', name: 'Punto Bolito - Doña Luz', dist: '200m', rating: 4.8, services: ['RETIRO', 'DEPÓSITO'], latitude: -16.5000, longitude: -68.1200, address: 'Calle Murillo #456' },
];

export default function PointsDiscoveryScreen({ navigation, route }: any) {
    const [activeTab, setActiveTab] = React.useState('depositar');
    const [realPoints, setRealPoints] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetchRealPoints();
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
    }, [route.params?.initialTab]);

    const fetchRealPoints = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('cashier_points')
                .select('*')
                .eq('is_active', true);

            if (data && !error) {
                // Mapear datos de DB al formato de la UI
                const mapped = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    dist: 'Cerca de ti', // Aquí se podría calcular distancia real con GPS
                    rating: p.rating || 5.0,
                    services: p.services || ['DEPÓSITO', 'RETIRO'],
                    latitude: p.latitude,
                    longitude: p.longitude,
                    address: p.address,
                    owner_id: p.owner_id
                }));
                setRealPoints(mapped);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <LinearGradient
                colors={['#000833', '#0026e3']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PUNTOS BOLITO</Text>
            </LinearGradient>

            <View style={styles.content}>
                <Text style={styles.mainTitle}>¿Qué quieres hacer hoy?</Text>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'depositar' && styles.tabActive]}
                        onPress={() => setActiveTab('depositar')}
                    >
                        <Text style={[styles.tabText, activeTab === 'depositar' && styles.tabTextActive]}>Depositar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'retirar' && styles.tabActive]}
                        onPress={() => setActiveTab('retirar')}
                    >
                        <Text style={[styles.tabText, activeTab === 'retirar' && styles.tabTextActive]}>Retirar</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {isLoading ? (
                        <View style={{ marginTop: 40, alignItems: 'center' }}>
                            <Text style={{ color: '#64748b' }}>Buscando puntos cercanos...</Text>
                        </View>
                    ) : realPoints.filter(p => {
                        if (activeTab === 'depositar') return p.services.includes('DEPÓSITO');
                        if (activeTab === 'retirar') return p.services.includes('RETIRO');
                        return true;
                    }).length === 0 ? (
                        <View style={{ marginTop: 40, alignItems: 'center' }}>
                            <Text style={{ color: '#64748b' }}>No hay puntos disponibles en esta zona.</Text>
                        </View>
                    ) : realPoints.filter(p => {
                        if (activeTab === 'depositar') return p.services.includes('DEPÓSITO');
                        if (activeTab === 'retirar') return p.services.includes('RETIRO');
                        return true;
                    }).map((point) => (
                        <View key={point.id} style={styles.pointCard}>
                            <View style={styles.iconBox}>
                                <View style={styles.blueCircle}>
                                    <View style={styles.templeIcon} />
                                </View>
                            </View>

                            <View style={styles.cardContent}>
                                <Text style={styles.pointName}>{point.name}</Text>
                                <View style={styles.infoRow}>
                                    <Text style={styles.distText}>{point.dist} • </Text>
                                    <Text style={styles.ratingText}>{point.rating} </Text>
                                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                                    <View style={styles.servicesRow}>
                                        {point.services.map(s => (
                                            <View key={s} style={[styles.serviceBadge, { borderColor: '#1e40af' }]}>
                                                <Text style={styles.serviceText}>{s}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.mapBtn}
                                onPress={() => navigation.navigate('PointsMap', { point })}
                            >
                                <View style={styles.miniIcon}>
                                    <MapPin size={12} color="#3730a3" />
                                </View>
                                <Text style={styles.mapBtnText}>Ver Mapa</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        height: 120,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 25,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 15,
        padding: 6,
        marginBottom: 25,
    },
    tab: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    tabActive: {
        backgroundColor: 'white',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 3 }
        })
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#111827',
    },
    pointCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    blueCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#1e40af',
        justifyContent: 'center',
        alignItems: 'center',
    },
    templeIcon: {
        width: 14,
        height: 10,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: '#1e40af',
    },
    cardContent: {
        flex: 1,
    },
    pointName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    distText: {
        fontSize: 13,
        color: '#64748b',
    },
    ratingText: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 4,
    },
    servicesRow: {
        flexDirection: 'row',
        marginLeft: 8,
        gap: 6,
    },
    serviceBadge: {
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    serviceText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    mapBtn: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mapBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#3730a3',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    miniIcon: {
        marginRight: 4,
    },
    operateBtn: {
        backgroundColor: '#0026e3',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
    },
    operateBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: 'white',
    },
});
