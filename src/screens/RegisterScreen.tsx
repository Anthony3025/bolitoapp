import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Image, ScrollView, Dimensions, Modal, Animated } from 'react-native';
import { XCircle, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';


const { width, height } = Dimensions.get('window');

const FloatingOrbs = () => {
    return (
        <View style={styles.orbLayer} pointerEvents="none">
            <View style={[styles.orb, { width: width * 1.5, height: width * 1.5, top: -width * 0.8, right: -width * 0.5, backgroundColor: '#e0e7ff', opacity: 0.5 }]} />
            <View style={[styles.orb, { width: width * 0.6, height: width * 0.6, bottom: height * 0.05, left: -width * 0.1, backgroundColor: '#818cf8', opacity: 0.1 }]} />
        </View>
    );
};

export default function RegisterScreen() {
    const navigation = useNavigation<any>();
    const { login, setLoading, setHasCompletedKyc } = useAuthStore();


    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState(['', '', '', '']);
    const [displayPin, setDisplayPin] = useState(['', '', '', '']);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [isConfirmingPin, setIsConfirmingPin] = useState(false);
    const [firstPin, setFirstPin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    // Alert Modal State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'error' | 'success' | 'info';
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' = 'error') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    // Refs for PIN inputs
    const pin1Ref = useRef<TextInput>(null);
    const pin2Ref = useRef<TextInput>(null);
    const pin3Ref = useRef<TextInput>(null);
    const pin4Ref = useRef<TextInput>(null);
    const pinRefs = useMemo(() => [pin1Ref, pin2Ref, pin3Ref, pin4Ref], [pin1Ref, pin2Ref, pin3Ref, pin4Ref]);

    const nameLabelAnim = useRef(new Animated.Value(name ? 1 : 0)).current;
    const phoneLabelAnim = useRef(new Animated.Value(phone ? 1 : 0)).current;

    const handlePinChange = (val: string, index: number) => {
        const cleaned = val.replace(/[^0-9]/g, '');

        if (cleaned.length > 1) {
            const digits = cleaned.split('');
            const newPin = [...pin];
            const newDisplayPin = [...displayPin];
            for (let i = 0; i < digits.length && (index + i) < 4; i++) {
                newPin[index + i] = digits[i];
                newDisplayPin[index + i] = '•';
            }
            setPin(newPin);
            setDisplayPin(newDisplayPin);

            const nextIdx = Math.min(index + digits.length, 3);
            if (nextIdx > index) {
                pinRefs[nextIdx].current?.focus();
            }
            return;
        }

        const newPin = [...pin];
        const newDisplayPin = [...displayPin];
        newPin[index] = cleaned;
        newDisplayPin[index] = cleaned;
        setPin(newPin);
        setDisplayPin(newDisplayPin);

        if (cleaned !== '') {
            setTimeout(() => {
                setDisplayPin(prev => {
                    const upf = [...prev];
                    if (upf[index] !== '') upf[index] = '•';
                    return upf;
                });
            }, 180);

            if (index < 3) {
                setTimeout(() => pinRefs[index + 1].current?.focus(), 10);
            } else if (index === 3) {
                const currentPin = newPin.join('');
                if (!isConfirmingPin) {
                    setTimeout(() => {
                        setFirstPin(currentPin);
                        setIsConfirmingPin(true);
                        setPin(['', '', '', '']);
                        setDisplayPin(['', '', '', '']);
                        pinRefs[0].current?.focus();
                    }, 250);
                } else {
                    if (currentPin !== firstPin) {
                        showAlert("Claves no coinciden", "Las claves ingresadas no son iguales. Por favor, intenta de nuevo.", 'error');
                        setIsConfirmingPin(false);
                        setFirstPin('');
                        setPin(['', '', '', '']);
                        setDisplayPin(['', '', '', '']);
                        pinRefs[0].current?.focus();
                    }
                }
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (pin[index] === '' && index > 0) {
                pinRefs[index - 1].current?.focus();
            } else {
                const newPin = [...pin];
                const newDisplayPin = [...displayPin];
                newPin[index] = '';
                newDisplayPin[index] = '';
                setPin(newPin);
                setDisplayPin(newDisplayPin);
            }
        }
    };

    const handleRegister = async () => {
        if (isSubmitting) return;

        console.log('Register pressed', { name, phone, pinLen: pin.join('').length });


        if (!name || !phone || pin.join('').length < 4) {
            showAlert("Datos incompletos", "Por favor completa todos los campos para continuar.", 'info');
            return;
        }

        if (!isConfirmingPin) {
            showAlert("Confirma tu clave", "Debes ingresar tu clave de 4 dígitos una vez más para confirmar.", 'info');
            return;
        }

        if (pin.join('') !== firstPin) {
            showAlert("Error de clave", "Las claves no coinciden. Intenta de nuevo.", 'error');
            return;
        }

        // Format phone for the 'Email Trick' - Just keep digits
        const cleanPhone = phone.replace(/\D/g, '');
        const internalEmail = cleanPhone + '@bolito-app.com';


        try {
            setIsSubmitting(true);
            console.log('Attempting Supabase SignUp...', { cleanPhone });

            const { data, error } = await supabase.auth.signUp({
                email: internalEmail,
                password: pin.join('') + '00', // Padding to reach 6 chars
                options: {
                    data: {
                        full_name: name,
                        phone: phone, // Save raw phone in metadata
                    }
                }
            });



            console.log('Supabase SignUp Result:', { data, error });

            if (error) {
                showAlert("Error de Registro", error.message, 'error');
            } else {
                console.log('Signup Successful. Session:', !!data.session);

                // Explicitly set KYC as not completed for new signups
                setHasCompletedKyc(false);

                if (data.session) {
                    // Navigator will auto-switch to KYC branch because isAuthenticated = true
                    showAlert("Cuenta Creada", "¡Bienvenido! Redirigiendo...", "success");
                } else {
                    // Fallback for manual confirmation flow
                    showAlert("Cuenta Creada", "¡Bienvenido! Pasando a la verificación...", "success");
                    setTimeout(() => {
                        if (navigation.isFocused()) {
                            navigation.navigate('KYC', { name, phone });
                        }
                    }, 1500);
                }
            }



        } catch (err: any) {
            console.error('Registration Catch Error:', err);
            showAlert("Error", `Ocurrió un error inesperado: ${err.message || 'Desconocido'}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };




    const handleFocus = (field: string, anim: Animated.Value) => {
        setFocusedInput(field);
        Animated.spring(anim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: false,
        }).start();
    };

    const handleBlur = (field: string, anim: Animated.Value, value: string) => {
        setFocusedInput(null);
        if (!value) {
            Animated.spring(anim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: false,
            }).start();
        }
    };

    const getLabelStyle = (anim: Animated.Value) => ({
        position: 'absolute' as const,
        left: 12,
        top: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [18, -10],
        }),
        fontSize: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['#6b7280', '#0026e3'],
        }),
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 4,
        zIndex: 1,
        fontWeight: '600' as const,
    });

    const OverlayAlert = () => {
        const backdropOpacity = useRef(new Animated.Value(0)).current;
        const cardScale = useRef(new Animated.Value(0.85)).current;
        const cardOpacity = useRef(new Animated.Value(0)).current;
        const [isVisible, setIsVisible] = useState(false);

        useEffect(() => {
            if (alertConfig.visible) {
                setIsVisible(true);
                Animated.parallel([
                    Animated.timing(backdropOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.spring(cardScale, {
                        toValue: 1,
                        stiffness: 300,
                        damping: 25,
                        mass: 0.8,
                        useNativeDriver: true,
                    }),
                    Animated.timing(cardOpacity, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: true,
                    })
                ]).start();

                // Auto-dismiss for non-error types
                if (alertConfig.type !== 'error') {
                    const timer = setTimeout(() => handleClose(), 3200);
                    return () => clearTimeout(timer);
                }
            }
        }, [alertConfig.visible]);

        const handleClose = () => {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(cardScale, {
                    toValue: 0.92,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(cardOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setIsVisible(false);
                setAlertConfig(prev => ({ ...prev, visible: false }));
            });
        };

        if (!isVisible) return null;

        return (
            <Animated.View style={[styles.overlayContainer, { opacity: backdropOpacity }]}>
                <TouchableOpacity
                    activeOpacity={1}
                    style={StyleSheet.absoluteFill}
                    onPress={alertConfig.type !== 'error' ? handleClose : undefined}
                />
                <Animated.View style={[
                    styles.overlayCard,
                    {
                        opacity: cardOpacity,
                        transform: [{ scale: cardScale }]
                    }
                ]}>
                    <View style={[
                        styles.overlayIconWrapper,
                        { backgroundColor: alertConfig.type === 'error' ? '#ef4444' : '#0026e3' }
                    ]}>
                        {alertConfig.type === 'error' ? (
                            <XCircle color="white" size={40} strokeWidth={2.5} />
                        ) : alertConfig.type === 'success' ? (
                            <CheckCircle2 color="white" size={40} strokeWidth={2.5} />
                        ) : (
                            <AlertCircle color="white" size={40} strokeWidth={2.5} />
                        )}
                    </View>
                    <Text style={styles.overlayTitle}>{alertConfig.title}</Text>
                    <Text style={styles.overlaySubtitle}>{alertConfig.message}</Text>
                    <TouchableOpacity
                        style={styles.overlayButton}
                        onPress={handleClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.overlayButtonText}>Entendido</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        );
    };

    return (
        <LinearGradient
            colors={['#FFFFFF', '#e0e7ff', '#c7d2fe']}
            style={styles.container}
        >
            <StatusBar style="dark" />
            <FloatingOrbs />
            <OverlayAlert />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.innerContainer}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>Crea tu cuenta</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <Animated.Text style={getLabelStyle(nameLabelAnim)}>NOMBRE COMPLETO</Animated.Text>
                            <View style={[
                                styles.inputContainer,
                                focusedInput === 'name' && styles.inputContainerFocused
                            ]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder=""
                                    value={name}
                                    onChangeText={setName}
                                    onFocus={() => handleFocus('name', nameLabelAnim)}
                                    onBlur={() => handleBlur('name', nameLabelAnim, name)}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputWrapper, { marginTop: 25 }]}>
                            <Animated.Text style={getLabelStyle(phoneLabelAnim)}>CELULAR</Animated.Text>
                            <View style={[
                                styles.inputContainer,
                                focusedInput === 'phone' && styles.inputContainerFocused
                            ]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder=""
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                    onFocus={() => handleFocus('phone', phoneLabelAnim)}
                                    onBlur={() => handleBlur('phone', phoneLabelAnim, phone)}
                                />
                            </View>
                        </View>

                        <Text style={[styles.label, { marginTop: 25, textAlign: 'center', width: '100%' }]}>
                            {isConfirmingPin ? 'CONFIRMA TU CLAVE' : 'CLAVE DE SEGURIDAD (4 DÍGITOS)'}
                        </Text>
                        <View style={styles.pinContainer}>
                            {displayPin.map((digit, i) => (
                                <TextInput
                                    key={i}
                                    ref={pinRefs[i]}
                                    style={[
                                        styles.pinInput,
                                        digit !== '' && styles.pinInputFilled,
                                        focusedInput === `pin-${i}` && styles.pinInputFocused
                                    ]}
                                    maxLength={1}
                                    keyboardType="number-pad"
                                    value={digit}
                                    onChangeText={(val) => handlePinChange(val, i)}
                                    onKeyPress={(e) => handleKeyPress(e, i)}
                                    autoComplete="off"
                                    onFocus={() => setFocusedInput(`pin-${i}`)}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
                            onPress={handleRegister}
                            activeOpacity={0.8}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
                                    <Text style={styles.primaryButtonText}>Procesando...</Text>
                                </Animated.View>
                            ) : (
                                <Text style={styles.primaryButtonText}>Registrarme Ahora</Text>
                            )}
                        </TouchableOpacity>


                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.linkText}>¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia sesión</Text></Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        zIndex: 10,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 40,
        paddingBottom: 40,
        flexGrow: 1,
    },
    orbLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    orb: {
        position: 'absolute',
        borderRadius: 1000,
    },
    // Overlay Alert Styles (High Performance Alternative to Modal)
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: 30,
    },
    overlayCard: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 15,
    },
    overlayIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    overlayTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
        textAlign: 'center',
    },
    overlaySubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    overlayButton: {
        backgroundColor: '#f1f5f9',
        height: 52,
        width: '100%',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 5,
        transform: [{ translateX: 3.7 }],
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    form: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 30,
        borderRadius: 20,
        zIndex: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
    },
    inputWrapper: {
        marginTop: 20,
        width: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1.2,
        borderColor: '#e5e7eb',
        paddingHorizontal: 12,
        height: 56,
    },
    inputContainerFocused: {
        borderColor: '#0026e3',
        backgroundColor: '#FFFFFF',
    },
    inputIcon: {
        display: 'none',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    pinInput: {
        backgroundColor: '#f9fafb',
        width: '22%',
        height: 56,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        borderWidth: 1.2,
        borderColor: '#e5e7eb',
    },
    pinInputFocused: {
        borderColor: '#0026e3',
        backgroundColor: '#FFFFFF',
    },
    pinInputFilled: {
        borderColor: '#0026e3',
        backgroundColor: '#eff6ff',
    },
    primaryButton: {
        backgroundColor: '#0026e3',
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        shadowColor: '#0026e3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: '#4b5563',
        fontSize: 14,
    },
    linkTextBold: {
        color: '#0026e3',
        fontWeight: 'bold',
    },
});
