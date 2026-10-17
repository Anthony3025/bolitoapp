import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, FileText, Clock } from 'lucide-react-native';

export default function CustomizeQRScreen({ navigation }: any) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('1 día');

    const durations = [
        { label: '1 día', value: '1d' },
        { label: '1 semana', value: '1w' },
        { label: '1 mes', value: '1m' },
        { label: '6 meses', value: '6m' },
    ];

    const handleGenerateQR = () => {
        navigation.navigate('MyQR', {
            customAmount: amount,
            description: description,
            duration: duration,
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style="light" />

            {/* Header Curvo con Gradiente */}
            <LinearGradient
                colors={['#000833', '#0026e3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={32} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cobrar con QR</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Define tu cobro</Text>
                    <Text style={styles.subtitle}>
                        Personaliza tu código para recibir el monto exacto
                    </Text>
                </View>

                {/* Input de Monto */}
                <View style={styles.card}>
                    <View style={styles.inputLabelRow}>
                        <Text style={styles.inputLabel}>Monto a cobrar</Text>
                    </View>
                    <View style={styles.amountInputWrapper}>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor="#cbd5e1"
                            keyboardType="decimal-pad"
                        />
                    </View>
                    <Text style={styles.helperText}>
                        Ingresa el monto exacto para este cobro.
                    </Text>
                </View>

                {/* Input de Descripción */}
                <View style={styles.card}>
                    <View style={styles.inputLabelRow}>
                        <FileText size={20} color="#2563eb" style={styles.labelIcon} />
                        <Text style={styles.inputLabel}>Motivo o mensaje</Text>
                    </View>
                    <TextInput
                        style={styles.descriptionInput}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Ej: Pago de almuerzo, regalo..."
                        placeholderTextColor="#cbd5e1"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Duración del QR */}
                <View style={styles.card}>
                    <View style={styles.inputLabelRow}>
                        <Clock size={20} color="#2563eb" style={styles.labelIcon} />
                        <Text style={styles.inputLabel}>Duración del QR</Text>
                    </View>
                    <View style={styles.durationRow}>
                        {durations.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.durationChip,
                                    duration === item.label && styles.durationChipActive
                                ]}
                                onPress={() => setDuration(item.label)}
                            >
                                <Text style={[
                                    styles.durationText,
                                    duration === item.label && styles.durationTextActive
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Botones de Acción */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.generateButton}
                        onPress={handleGenerateQR}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.generateButtonText}>Generar QR de Cobro</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.simpleButton}
                        onPress={() => navigation.navigate('MyQR')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.simpleButtonText}>Usar mi QR de siempre</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 30,
        paddingBottom: 40,
    },
    textContainer: {
        marginBottom: 25,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    labelIcon: {
        marginRight: 8,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#334155',
    },
    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 8,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563eb',
        marginRight: 10,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    helperText: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 12,
        fontStyle: 'italic',
    },
    descriptionInput: {
        fontSize: 16,
        color: '#1e293b',
        minHeight: 80,
        textAlignVertical: 'top',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
    },
    buttonContainer: {
        marginTop: 20,
    },
    generateButton: {
        backgroundColor: '#0026e3', // Color del Login
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    generateButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    simpleButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    simpleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    durationRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    durationChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    durationChipActive: {
        backgroundColor: '#0026e3',
        borderColor: '#0026e3',
    },
    durationText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    durationTextActive: {
        color: 'white',
    },
});

