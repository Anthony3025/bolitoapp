import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useFocusEffect } from '@react-navigation/native';

export default function ProtectedOperationsScreen({ navigation }: any) {
    const user = useAuthStore((state) => state.user);
    const [compras, setCompras] = React.useState<any[]>([]);
    const [ventas, setVentas] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Recargar cuando la pantalla se enfoca
    useFocusEffect(
        React.useCallback(() => {
            fetchProtectedOperations();
        }, [user?.id])
    );

    const fetchProtectedOperations = async () => {
        if (!user?.id) return;
        try {
            // Obtener compras (donde soy buyer)
            const { data: purchases, error: purchasesError } = await supabase
                .from('safety_payments')
                .select('*')
                .eq('buyer_id', user.id)
                .eq('status', 'active');

            // Obtener ventas (donde soy seller, por UUID o teléfono)
            const { data: sales, error: salesError } = await supabase
                .from('safety_payments')
                .select('*')
                .or(`seller_id.eq.${user.id},seller_id.eq.${user.phone}`)
                .eq('status', 'active');

            if (!purchasesError && purchases) {
                setCompras(purchases);
            }

            if (!salesError && sales) {
                setVentas(sales);
            }
        } catch (e) {
            console.error('Error:', e);
        } finally {
            setLoading(false);
        }
    };

    const renderCard = (item: any, isBuyer: boolean) => (
        <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate(isBuyer ? 'BuyerTransactionDetail' : 'SellerTransactionDetail', { item })}
        >
            <View style={styles.cardIconContainer}>
                <ShieldCheck size={24} color="#10b981" fill="#e6f9f3" strokeWidth={2.5} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.description || (isBuyer ? 'Compra protegida' : 'Venta protegida')}</Text>
                <Text style={styles.cardAmount}>Bs. {item.total_amount?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleDateString()} - {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <ChevronRight size={20} color="#d1d5db" />
        </TouchableOpacity>
    );

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
                <Text style={styles.headerTitle}>Operaciones Protegidas</Text>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>MIS COMPRAS</Text>
                {compras.length > 0 ? (
                    compras.map(item => renderCard(item, true))
                ) : (
                    <Text style={styles.emptyText}>No tienes compras protegidas activas</Text>
                )}

                <View style={{ height: 30 }} />

                <Text style={styles.sectionTitle}>MIS VENTAS</Text>
                {ventas.length > 0 ? (
                    ventas.map(item => renderCard(item, false))
                ) : (
                    <Text style={styles.emptyText}>No tienes ventas protegidas activas</Text>
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
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
        padding: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#9ca3af',
        letterSpacing: 1,
        marginBottom: 15,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 22,
        marginBottom: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cardIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#e6f9f3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    cardAmount: {
        fontSize: 14,
        color: '#6b7280',
    },
    cardDate: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 2,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
});
