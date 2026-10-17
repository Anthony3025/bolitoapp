import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Scan, QrCode } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function QRActionScreen({ navigation }: any) {
    const handlePagar = () => {
        navigation.navigate('QRScanner', { action: 'pagar' });
    };

    const handleCobrar = () => {
        navigation.navigate('MyQR');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header Curvo con Gradiente Premium */}
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
                <Text style={styles.headerTitle}>Código QR</Text>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>¿Qué deseas hacer?</Text>
                    <Text style={styles.subtitle}>
                        Selecciona una opción para continuar con tu transacción
                    </Text>
                </View>

                {/* Botón Pagar */}
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={handlePagar}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#eef2ff', '#e0e7ff']}
                        style={styles.iconContainer}
                    >
                        <Scan size={44} color="#0026e3" strokeWidth={2.5} />
                    </LinearGradient>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Pagar</Text>
                        <Text style={styles.cardDescription}>
                            Escanea un código QR para enviar dinero al instante
                        </Text>
                    </View>
                    <View style={styles.arrowContainer}>
                        <Text style={styles.arrowIcon}>›</Text>
                    </View>
                </TouchableOpacity>

                {/* Botón Cobrar */}
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={handleCobrar}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#eef2ff', '#e0e7ff']}
                        style={styles.iconContainer}
                    >
                        <QrCode size={44} color="#0026e3" strokeWidth={2.5} />
                    </LinearGradient>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Cobrar</Text>
                        <Text style={styles.cardDescription}>
                            Genera tu propio código QR para recibir pagos
                        </Text>
                    </View>
                    <View style={styles.arrowContainer}>
                        <Text style={styles.arrowIcon}>›</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Decoración sutil en el fondo */}
            <View style={styles.decoration} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        height: 140,
        paddingTop: 50,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
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
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 35,
    },
    textContainer: {
        marginBottom: 35,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        lineHeight: 22,
    },
    actionCard: {
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 24,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 18,
    },
    arrowContainer: {
        marginLeft: 10,
    },
    arrowIcon: {
        fontSize: 32,
        color: '#cbd5e1',
        fontWeight: '300',
    },
    decoration: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(0, 38, 227, 0.03)',
        zIndex: -1,
    },
});

