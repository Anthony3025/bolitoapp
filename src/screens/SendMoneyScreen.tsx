import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, Animated, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Search, User, Check, Send, X, ArrowRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function SendMoneyScreen({ navigation }: any) {
    const [step, setStep] = useState(1); // 1: Select User, 2: Amount, 3: Success
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const user = useAuthStore((state) => state.user);
    const fetchProfile = useAuthStore((state) => state.fetchProfile);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [step]);

    useEffect(() => {
        if (searchQuery.length > 3) {
            handleSearch();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, phone')
                .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
                .neq('id', user?.id) // No buscarse a sí mismo
                .limit(5);

            if (data) setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setStep(2);
    };

    const handleSend = async () => {
        const numAmount = parseFloat(amount);
        if (!amount || numAmount <= 0) return;

        if (user?.balance && numAmount > user.balance) {
            Alert.alert("Saldo insuficiente", `Solo tienes Bs. ${user.balance}`);
            return;
        }

        setIsSending(true);
        try {
            // Llamada al RPC de SQL que creamos
            const { data, error } = await supabase.rpc('transfer_tokens', {
                p_sender_id: user?.id,
                p_receiver_phone: selectedUser.phone,
                p_amount: numAmount,
                p_description: 'Transferencia Bolito'
            });

            if (error) throw error;

            if (data?.success) {
                // Actualizar el saldo local en el store
                if (user?.id) await fetchProfile(user.id);
                setStep(3);
            } else {
                Alert.alert("Error", data?.message || "No se pudo realizar la transferencia");
            }
        } catch (error: any) {
            console.error('Transfer error:', error);
            Alert.alert("Error de Red", "No se pudo conectar con el servidor.");
        } finally {
            setIsSending(false);
        }
    };

    const filteredContacts = CONTACTS.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    const renderStep1 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>¿A quién quieres enviar?</Text>
            <View style={styles.searchContainer}>
                <Search size={20} color="#64748b" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Nombre o número de teléfono"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#94a3b8"
                />
            </View>

            <Text style={styles.subTitle}>{searchQuery.length > 0 ? 'Resultados de búsqueda' : 'Buscando por nombre o celular...'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
                {searchResults.map((contact) => (
                    <TouchableOpacity
                        key={contact.id}
                        style={styles.contactItem}
                        onPress={() => handleSelectUser({
                            name: contact.full_name,
                            phone: contact.phone
                        })}
                    >
                        <View style={styles.avatarContainer}>
                            <User size={24} color="#0026e3" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{contact.full_name}</Text>
                            <Text style={styles.contactPhone}>{contact.phone}</Text>
                        </View>
                        <ArrowRight size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <View style={styles.selectedUserCard}>
                <View style={styles.avatarLarge}>
                    <User size={32} color="white" />
                </View>
                <Text style={styles.selectedName}>{selectedUser?.name}</Text>
                <Text style={styles.selectedPhone}>{selectedUser?.phone}</Text>
                <TouchableOpacity onPress={() => { setStep(1); setAmount(''); }} style={styles.changeUserBtn}>
                    <Text style={styles.changeUserText}>Cambiar</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.amountLabel}>Monto a enviar</Text>
            <View style={styles.amountInputRow}>
                <Text style={styles.currencyPrefix}>Bs.</Text>
                <TextInput
                    style={styles.amountText}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    autoFocus
                    placeholderTextColor="#cbd5e1"
                />
            </View>



            <TouchableOpacity
                style={[styles.sendBtn, (!amount || isSending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!amount || isSending}
            >
                {isSending ? (
                    <Text style={styles.sendBtnText}>PROCESANDO...</Text>
                ) : (
                    <View style={styles.row}>
                        <Text style={styles.sendBtnText}>ENVIAR AHORA</Text>
                        <Send size={20} color="white" style={{ marginLeft: 10 }} />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );

    const renderStep3 = () => (
        <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
            <View style={styles.successIconCircle}>
                <Check size={50} color="white" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>¡Envío exitoso!</Text>
            <Text style={styles.successAmount}>Bs. {parseFloat(amount).toFixed(2)}</Text>
            <Text style={styles.successDetail}>Enviado a {selectedUser?.name}</Text>

            <View style={styles.receiptCard}>
                <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Fecha:</Text>
                    <Text style={styles.receiptValue}>{new Date().toLocaleDateString()}</Text>
                </View>
                <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transacción:</Text>
                    <Text style={styles.receiptValue}>#BOL-{Math.floor(Math.random() * 1000000)}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.finishBtn}
                onPress={() => navigation.navigate('Main')}
            >
                <Text style={styles.finishBtnText}>VOLVER AL INICIO</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={['#000833', '#0026e3']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(step - 1)}>
                        <ChevronLeft size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Enviar Dinero</Text>
                    <View style={{ width: 28 }} />
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        height: 110,
        paddingTop: 50,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1, padding: 20 },
    stepContainer: { flex: 1 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 25,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, color: '#1e293b' },
    subTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 15, textTransform: 'uppercase' },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    contactPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },

    // Step 2
    selectedUserCard: {
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 20,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarLarge: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#0026e3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    selectedName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    selectedPhone: { fontSize: 14, color: '#64748b', marginTop: 4 },
    changeUserBtn: { marginTop: 12, paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9' },
    changeUserText: { fontSize: 12, fontWeight: 'bold', color: '#0026e3' },
    amountLabel: { textAlign: 'center', fontSize: 14, color: '#64748b', marginBottom: 10 },
    amountInputRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
    currencyPrefix: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginRight: 10 },
    amountText: { fontSize: 56, fontWeight: 'bold', color: '#0026e3', minWidth: 150, textAlign: 'center' },
    spacer: { flex: 1 },
    sendBtn: {
        backgroundColor: '#0026e3',
        height: 65,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        marginTop: 40,
        marginBottom: 20,
    },
    sendBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
    sendBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    row: { flexDirection: 'row', alignItems: 'center' },

    // Success
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 50 },
    successIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
    successAmount: { fontSize: 42, fontWeight: 'black', color: '#1e293b', marginBottom: 5 },
    successDetail: { fontSize: 16, color: '#64748b', marginBottom: 30 },
    receiptCard: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    receiptLabel: { color: '#94a3b8', fontSize: 14 },
    receiptValue: { color: '#1e293b', fontSize: 14, fontWeight: 'bold' },
    finishBtn: {
        width: '100%',
        height: 60,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    finishBtnText: { color: '#1e293b', fontSize: 15, fontWeight: 'bold' },
});
