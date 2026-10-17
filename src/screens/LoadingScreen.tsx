import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
    const setLoading = useAuthStore((state) => state.setLoading);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotate1 = useRef(new Animated.Value(0)).current;
    const rotate2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in circles and text
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Pulse for the "heart" (dot) effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Continuous rotation for circles
        const rotation1 = Animated.loop(
            Animated.timing(rotate1, {
                toValue: 1,
                duration: 4500,
                useNativeDriver: true,
            })
        );

        const rotation2 = Animated.loop(
            Animated.timing(rotate2, {
                toValue: 1,
                duration: 3800,
                useNativeDriver: true,
            })
        );

        rotation1.start();
        rotation2.start();

        // Simulate initial load for demonstration
        const timer = setTimeout(() => {
            setLoading(false);
        }, 4000);

        return () => {
            clearTimeout(timer);
            rotation1.stop();
            rotation2.stop();
        };
    }, []);

    const spin1 = rotate1.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const spin2 = rotate2.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background color matches Splash Screen exactly */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ffffff' }]} />

            <View style={styles.content}>
                {/* Security Circles radiating from the logo center/point area */}
                <Animated.View style={[styles.circleContainer, {
                    opacity: fadeAnim,
                    transform: [{ scale: pulseAnim }]
                }]}>
                    <Animated.View
                        style={[
                            styles.circle,
                            styles.circle1,
                            { transform: [{ rotate: spin1 }] }
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.circle,
                            styles.circle2,
                            { transform: [{ rotate: spin2 }] }
                        ]}
                    />
                </Animated.View>

                {/* Official BOLITO Logo */}
                <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 500,
        height: 250,
        zIndex: 2,
    },
    circleContainer: {
        position: 'absolute',
        width: 500,
        height: 500,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
        borderRadius: 300,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    circle1: {
        width: 400,
        height: 400,
        borderColor: 'rgba(0, 38, 227, 0.15)', // Brand Blue
    },
    circle2: {
        width: 440,
        height: 440,
        borderColor: 'rgba(0, 214, 143, 0.1)', // Brand Green
    },
    footer: {
        position: 'absolute',
        bottom: 70,
        alignItems: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    loadingText: {
        color: '#374151', // Grey-700
        fontSize: 17,
        fontWeight: '600',
    },
    dots: {
        color: '#0026e3',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    secureBadge: {
        backgroundColor: 'rgba(0, 38, 227, 0.05)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 38, 227, 0.1)',
    },
    badgeText: {
        color: '#0026e3',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    }
});
