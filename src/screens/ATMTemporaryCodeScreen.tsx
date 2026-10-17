import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ATMTemporaryCodeScreen() {
    const navigation = useNavigation<any>();
    const [code, setCode] = useState('');
    const generateCode = () => {
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        setCode(newCode);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    useEffect(() => {
        generateCode();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CÓDIGO DE SEGURIDAD ATM</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Usa este código en el cajero</Text>
                    <Text style={styles.infoSub}>Ingresa estos 4 dígitos en la pantalla del ATM para completar tu operación.</Text>

                    <View style={styles.codeContainer}>
                        {code.split('').map((digit, index) => (
                            <View key={index} style={styles.digitBox}>
                                <Text style={styles.digitText}>{digit}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.timerContainer}>
                        <Clock size={20} color="#6366f1" style={{ marginRight: 8 }} />
                        <Text style={styles.timerText}>Válido por 5 minutos</Text>
                    </View>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionBtn} onPress={generateCode}>
                        <View style={[styles.iconBg, { backgroundColor: '#f0fdf4' }]}>
                            <RefreshCw size={24} color="#10b981" />
                        </View>
                        <Text style={styles.actionLabel}>Nuevo Código</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000514', // Deep Midnight Blue
    },
    header: {
        height: 120,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 1,
        opacity: 0.9,
    },
    content: {
        flex: 1,
        padding: 25,
        justifyContent: 'center',
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)', // Glass effect
        borderRadius: 40,
        padding: 35,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    infoTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    infoSub: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginVertical: 45,
    },
    digitBox: {
        width: 65,
        height: 85,
        backgroundColor: 'rgba(0, 38, 227, 0.1)', // Tinted Bolito Blue
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 38, 227, 0.3)',
    },
    digitText: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFFFFF', // Pure White
        textShadowColor: 'rgba(255, 255, 255, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    timerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 50,
    },
    actionBtn: {
        alignItems: 'center',
    },
    iconBg: {
        width: 70,
        height: 70,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.6)',
    },
});
