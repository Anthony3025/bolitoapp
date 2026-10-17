import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Pressable
} from 'react-native';
import { ArrowLeft, Plus, CreditCard, Landmark, ChevronRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { usePaymentStore } from '../store/paymentStore';

export default function CardsAccountsScreen({ navigation }: any) {
    const brandBlue = '#0026e3';
    const { cards, accounts, deleteCard, deleteAccount } = usePaymentStore();
    const [showAddMenu, setShowAddMenu] = React.useState(false);

    const handleDelete = (id: string, type: 'card' | 'account') => {
        Alert.alert(
            "Eliminar",
            "¿Estás seguro que deseas eliminar este método?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar", style: "destructive", onPress: () => {
                        if (type === 'card') deleteCard(id);
                        else deleteAccount(id);
                    }
                }
            ]
        );
    };

    const CardItem = ({ id, type, last4, brand, logo: Icon, isAccount }: any) => (
        <TouchableOpacity
            style={styles.itemCard}
            onLongPress={() => handleDelete(id, isAccount ? 'account' : 'card')}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${brandBlue}10` }]}>
                <Icon color={brandBlue} size={24} />
            </View>
            <View style={styles.itemTextContainer}>
                <Text style={styles.itemTitle}>{type} •••• {last4}</Text>
                <Text style={styles.itemSubtitle}>{brand}</Text>
            </View>
            <ChevronRight color="#94a3b8" size={20} />
        </TouchableOpacity>
    );

    const AddSubMenu = () => {
        if (!showAddMenu) return null;

        return (
            <Pressable
                style={styles.menuOverlay}
                onPress={() => setShowAddMenu(false)}
            >
                <View style={styles.menuContainer}>
                    <TouchableOpacity
                        style={styles.menuOption}
                        onPress={() => {
                            setShowAddMenu(false);
                            navigation.navigate('AddCard');
                        }}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#f0f4ff' }]}>
                            <CreditCard color={brandBlue} size={20} />
                        </View>
                        <Text style={styles.menuText}>Agregar Tarjeta</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                        style={styles.menuOption}
                        onPress={() => {
                            setShowAddMenu(false);
                            navigation.navigate('AddAccount');
                        }}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: '#f0f4ff' }]}>
                            <Landmark color={brandBlue} size={20} />
                        </View>
                        <Text style={styles.menuText}>Agregar cuenta bancaria</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <AddSubMenu />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color={brandBlue} size={26} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tarjetas y Cuentas</Text>
                <TouchableOpacity
                    style={[styles.addButton, showAddMenu && { backgroundColor: brandBlue }]}
                    onPress={() => setShowAddMenu(!showAddMenu)}
                >
                    <Plus color={showAddMenu ? "white" : brandBlue} size={24} strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Tus Tarjetas</Text>
                <View style={styles.section}>
                    {cards.length > 0 ? cards.map((card, i) => (
                        <View key={card.id}>
                            <CardItem id={card.id} type={card.type} last4={card.last4} brand={card.brand} logo={CreditCard} />
                            {i < cards.length - 1 && <View style={styles.divider} />}
                        </View>
                    )) : (
                        <Text style={styles.emptyText}>No hay tarjetas vinculadas</Text>
                    )}
                </View>

                <Text style={styles.sectionLabel}>Tus Cuentas Bancarias</Text>
                <View style={styles.section}>
                    {accounts.length > 0 ? accounts.map((acc, i) => (
                        <View key={acc.id}>
                            <CardItem id={acc.id} type={acc.accountType} last4={acc.accountNumber.slice(-4)} brand={acc.bankName} logo={Landmark} isAccount />
                            {i < accounts.length - 1 && <View style={styles.divider} />}
                        </View>
                    )) : (
                        <Text style={styles.emptyText}>No hay cuentas vinculadas</Text>
                    )}
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
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f0f4ff',
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
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    itemSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 15,
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#94a3b8',
        fontSize: 14,
    },
    // Submenu Styles
    menuOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.3)',
        zIndex: 5,
    },
    menuContainer: {
        position: 'absolute',
        top: 110,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        width: 200,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 8,
        marginVertical: 4,
    },
});
