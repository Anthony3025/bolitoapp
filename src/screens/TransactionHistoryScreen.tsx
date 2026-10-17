import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ShieldCheck, Clock, Search, Filter } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function TransactionHistoryScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const [transactions, setTransactions] = React.useState<any[]>([]);
    const [refreshing, setRefreshing] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    const fetchTransactions = async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setTransactions(data);
            }
        } catch (e) {
            console.error('Error fetching history:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        fetchTransactions();
    }, [user?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const renderTransaction = (item: any, idx: number) => {
        const date = new Date(item.created_at);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isProtected = item.type === 'PROTECTED_PAYMENT' || item.metadata?.protected;

        return (
            <View key={item.id} style={styles.transactionCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                        <Clock size={20} color="#0026e3" />
                    </View>
                    <View style={styles.titleSection}>
                        <Text style={styles.txnTitle} numberOfLines={1}>{item.description || 'Transacción'}</Text>
                        <Text style={styles.txnDate}>{dateStr} • {timeStr}</Text>
                    </View>
                    <View style={styles.amountSection}>
                        <Text style={styles.txnAmount}>- Bs. {item.amount.toFixed(2)}</Text>
                        <View style={styles.statusRow}>
                            {isProtected && (
                                <ShieldCheck color="#10b981" size={14} fill="#10b981" style={{ marginRight: 4 }} />
                            )}
                            <Text style={[styles.statusText, isProtected && { color: '#10b981', fontWeight: 'bold' }]}>
                                {item.status === 'completed' ? (isProtected ? 'Protegido' : 'Completado') : item.status}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
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
                <Text style={styles.headerTitle}>Historial de Movimientos</Text>
            </LinearGradient>

            <View style={styles.filterSection}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#94a3b8" />
                    <Text style={styles.searchText}>Buscar movimientos...</Text>
                </View>
                <TouchableOpacity style={styles.filterButton}>
                    <Filter size={20} color="#0026e3" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0026e3" />
                }
            >
                {loading ? (
                    <View style={styles.emptyState}>
                        <Text style={{ color: '#94a3b8' }}>Cargando movimientos...</Text>
                    </View>
                ) : transactions.length > 0 ? (
                    transactions.map((item, idx) => renderTransaction(item, idx))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No tienes movimientos registrados.</Text>
                    </View>
                )}
            </ScrollView>
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
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    filterSection: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    searchText: {
        color: '#94a3b8',
        marginLeft: 10,
        fontSize: 14,
    },
    filterButton: {
        width: 50,
        height: 50,
        backgroundColor: 'white',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    transactionCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleSection: {
        flex: 1,
    },
    txnTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    txnDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    amountSection: {
        alignItems: 'flex-end',
    },
    txnAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 11,
        color: '#64748b',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 15,
    }
});
