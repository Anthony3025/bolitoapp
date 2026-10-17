import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const FloatingOrbs = () => {
    return (
        <View style={StyleSheet.absoluteFill}>
            <View style={[styles.orb, { width: width * 1.5, height: width * 1.5, top: -width * 0.8, right: -width * 0.5, backgroundColor: '#e0e7ff', opacity: 0.5 }]} />
            <View style={[styles.orb, { width: width * 0.6, height: width * 0.6, bottom: height * 0.05, left: -width * 0.1, backgroundColor: '#818cf8', opacity: 0.1 }]} />
        </View>
    );
};

export default function WelcomeScreen() {
    const navigation = useNavigation<any>();

    return (
        <LinearGradient
            colors={['#FFFFFF', '#e0e7ff', '#c7d2fe']}
            style={styles.container}
        >
            <StatusBar style="dark" />
            <FloatingOrbs />

            {/* Espaciador superior para compensar el peso del footer y centrar el logo perfectamente */}
            <View style={{ height: 100 }} />

            <View style={styles.content}>
                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.primaryButtonText}>Crear cuenta ahora</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 30,
    },
    orb: {
        position: 'absolute',
        borderRadius: 1000,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        zIndex: 1,
    },
    logo: {
        width: 260,
        height: 260,
        marginBottom: 20,
        transform: [{ translateX: 3.7 }], // Ajuste óptico final de 3.7px a la derecha
    },
    footer: {
        width: '100%',
        gap: 15,
        zIndex: 2,
        paddingBottom: 50,
    },
    primaryButton: {
        width: '100%',
        backgroundColor: '#0026e3',
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    secondaryButtonText: {
        color: '#1f2937',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
