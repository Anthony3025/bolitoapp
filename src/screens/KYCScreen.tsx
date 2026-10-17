import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Alert, ActivityIndicator, Animated, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, CameraView } from 'expo-camera';
import { supabase } from '../lib/supabase';
import { IdCard, Shield, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const FloatingOrbs = () => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.orb, { width: width * 1.5, height: width * 1.5, top: -width * 0.8, right: -width * 0.5, backgroundColor: '#e0e7ff', opacity: 0.5 }]} />
            <View style={[styles.orb, { width: width * 0.6, height: width * 0.6, bottom: height * 0.05, left: -width * 0.1, backgroundColor: '#818cf8', opacity: 0.1 }]} />
        </View>
    );
};


export default function KYCScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const [step, setStep] = useState(1);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showFlash, setShowFlash] = useState(false);

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const setHasCompletedKyc = useAuthStore((state) => state.setHasCompletedKyc);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const cameraRef = useRef<any>(null);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const successScale = useRef(new Animated.Value(0.9)).current;

    const [frontIdUrl, setFrontIdUrl] = useState<string | null>(null);
    const [backIdUrl, setBackIdUrl] = useState<string | null>(null);
    const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

    // Custom Alert Modal
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'error' | 'success' | 'info';
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });

    const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' = 'success', onConfirm?: () => void) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm });
    };

    // Custom Alert Modal Component
    const CustomAlertModal = () => {
        const [isVisible, setIsVisible] = useState(false);
        const backdropOpacity = useRef(new Animated.Value(0)).current;
        const cardScale = useRef(new Animated.Value(0.92)).current;
        const cardOpacity = useRef(new Animated.Value(0)).current;

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
                if (alertConfig.onConfirm) {
                    alertConfig.onConfirm();
                }
            });
        };

        if (!isVisible) return null;

        return (
            <Animated.View style={[styles.overlayContainer, { opacity: backdropOpacity }]}>
                <TouchableOpacity
                    activeOpacity={1}
                    style={StyleSheet.absoluteFill}
                    onPress={handleClose}
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
                            <Text style={styles.overlayIcon}>✕</Text>
                        ) : (
                            <Text style={styles.overlayIcon}>✓</Text>
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


    const { name = 'Usuario', phone = '76253324' } = route.params || {};

    useEffect(() => {
        // TEMPORAL: Forzar logout para limpiar el token viejo invalido
        const clearStaleSession = async () => {
            console.log("Limpiando sesión viciada...");
            await supabase.auth.signOut();
            useAuthStore.getState().logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
            });
        };

        // Descomentar esta linea UNA VEZ para limpiar, luego volver a comentar
        // clearStaleSession();

        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');

            // Verificar si el usuario ya tiene un trámite pendiente
            if (user?.id) {
                const { data } = await supabase
                    .from('kyc_verifications')
                    .select('status')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (data && (data.status === 'manual_review' || data.status === 'pending')) {
                    showAlert(
                        "Verificación en Proceso",
                        "Tu identidad está siendo validada. Podrás acceder al dashboard una vez aprobada.",
                        'info',
                        () => logout()
                    );
                }
            }
        })();
    }, []);

    useEffect(() => {
        // Animación de entrada
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    }, [step]);

    const uploadImage = async (uri: string, filename: string): Promise<string | null> => {
        try {
            setIsUploading(true);

            console.log('Starting upload...', { uri, filename });

            // Leer la imagen como ArrayBuffer
            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();
            const fileData = new Uint8Array(arrayBuffer);

            const userId = user?.id || 'temp';
            const filePath = `${userId}/${filename}`;

            console.log('Uploading to Supabase Storage...', { filePath, size: fileData.length });

            const { data, error } = await supabase.storage
                .from('kyc-documents')
                .upload(filePath, fileData, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) {
                console.error('Upload error:', error);
                Alert.alert('Error de Subida', `No se pudo subir la imagen: ${error.message}`);
                return null;
            }

            console.log('Upload successful:', data);

            const { data: urlData } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(filePath);

            console.log('Public URL:', urlData.publicUrl);

            return urlData.publicUrl;
        } catch (error: any) {
            console.error('Upload catch error:', error);
            Alert.alert('Error', `Ocurrió un error: ${error.message || 'Desconocido'}`);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const takePicture = async () => {
        if (!cameraRef.current) return;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.85,
                base64: false,
            });

            setShowCamera(false);

            let filename = '';
            if (step === 1) filename = 'front_id.jpg';
            else if (step === 2) filename = 'back_id.jpg';
            else filename = 'selfie.jpg';

            const url = await uploadImage(photo.uri, filename);

            if (url) {
                if (step === 1) setFrontIdUrl(url);
                else if (step === 2) setBackIdUrl(url);
                else setSelfieUrl(url);

                // Flash and Haptic Feedback
                setShowFlash(true);
                setTimeout(() => setShowFlash(false), 100);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Show Success Overlay
                setSuccessMessage(
                    step === 1 ? "¡Frente del carnet capturado!" :
                        step === 2 ? "¡Reverso del carnet capturado!" :
                            "¡Selfie capturada con éxito!"
                );
                setShowSuccessOverlay(true);
                successScale.setValue(0.9);
                Animated.spring(successScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true
                }).start();

                setTimeout(async () => {
                    setShowSuccessOverlay(false);
                    if (step < 3) {
                        setStep(step + 1);
                    } else {
                        await verifyKYC(frontIdUrl!, backIdUrl!, url);
                    }
                }, 1500);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
        }
    };

    const verifyKYC = async (frontUrl: string, backUrl: string, selfie: string) => {
        try {
            setIsVerifying(true);

            // 1. Guardar registro inicial
            const { error: insertError } = await supabase
                .from('kyc_verifications')
                .upsert({
                    user_id: user?.id,
                    front_id_url: frontUrl,
                    back_id_url: backUrl,
                    selfie_url: selfie,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            // 2. DEBUG: Llamada Fetch MANUAL para ver el error real
            console.log('DEBUG: Fetch manual a verify-kyc...');
            const functionUrl = 'https://tgonjixsyplqxqhnnoev.supabase.co/functions/v1/verify-kyc';

            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            // IMPORTANTE: La apikey es necesaria para pasar el gateway
            const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb25qaXhzeXBscXhxaG5ub2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDIwMTEsImV4cCI6MjA4NDU3ODAxMX0.CWnemsFvqFLsK-ODfrJ1BypwQUryOd2PwKylFbkY4rM';

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'apikey': anonKey
                },
                body: JSON.stringify({
                    user_id: user?.id,
                    front_id_url: frontUrl,
                    back_id_url: backUrl,
                    selfie_url: selfie
                })
            });

            const textBody = await response.text();
            console.log(`DEBUG: Status ${response.status} | Body: ${textBody}`);

            if (!response.ok) {
                showAlert("Error del Servidor", `Status: ${response.status}\n${textBody.substring(0, 200)}`, 'error');
                return;
            }

            const data = JSON.parse(textBody); // Si es exitoso, parseamos


            const { status, score } = data;

            if (status === 'approved') {
                showAlert(
                    "¡Verificado!",
                    "Tu identidad ha sido confirmada con éxito.",
                    'success',
                    () => {
                        setHasCompletedKyc(true);
                    }
                );
            } else {
                showAlert(
                    "Verificación Fallida",
                    "No pudimos validar tu identidad. Asegúrate de que las fotos sean claras, el documento sea el correcto y los datos coincidan con tu registro.",
                    'error',
                    () => {
                        // Reiniciar el proceso para que lo intente de nuevo con mejores fotos
                        setStep(1);
                        setFrontIdUrl(null);
                        setBackIdUrl(null);
                        setSelfieUrl(null);
                        setShowCamera(false);
                    }
                );
            }
        } catch (error: any) {
            console.error('Verify KYC error:', error);
            showAlert("Error", `Ocurrió un error inesperado: ${error.message}`, 'error');
        } finally {
            setIsVerifying(false);
        }
    };


    const handleCapture = () => {
        if (hasPermission === null) {
            Alert.alert('Esperando permisos', 'Solicitando acceso a la cámara...');
            return;
        }

        if (hasPermission === false) {
            Alert.alert(
                'Permiso Requerido',
                'Necesitamos acceso a tu cámara para verificar tu identidad.',
                [{ text: 'OK' }]
            );
            return;
        }

        setShowCamera(true);
    };

    const steps = [
        {
            title: "Carnet de Identidad",
            subtitle: "Lado frontal",
            instruction: "Coloca el frente de tu carnet en el recuadro. Evita reflejos de luz y asegúrate de que el texto sea legible.",
            icon: IdCard,
            color: '#0026e3'
        },
        {
            title: "Carnet de Identidad",
            subtitle: "Lado posterior",
            instruction: "Ahora gira tu carnet. Captura la parte posterior asegurándote de que los bordes encajen bien.",
            icon: IdCard,
            color: '#0026e3'
        },
        {
            title: "Verificación Facial",
            subtitle: "Tu rostro",
            instruction: "Sujeta el teléfono a la altura de tus ojos. Mira a la cámara y asegúrate de tener buena iluminación.",
            icon: Shield, // Changed to Shield for a more sophisticated "Security" feel
            color: '#6366f1'
        },
    ];

    const currentStep = steps[step - 1];
    const StepIcon = currentStep.icon;
    const hasPhoto = (step === 1 && frontIdUrl) || (step === 2 && backIdUrl) || (step === 3 && selfieUrl);
    const photoUrl = step === 1 ? frontIdUrl : step === 2 ? backIdUrl : selfieUrl;

    // Pantalla de cámara
    if (showCamera) {
        return (
            <View style={styles.cameraContainer}>
                <StatusBar style="light" />
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={step === 3 ? 'front' : 'back'}
                />

                <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.cameraGradient}
                >
                    {/* Header */}
                    <View style={styles.cameraHeader}>
                        <TouchableOpacity
                            style={styles.cameraClose}
                            onPress={() => setShowCamera(false)}
                        >
                            <Text style={styles.cameraCloseText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Guía central */}
                    <View style={styles.cameraCenter}>
                        <View style={step === 3 ? styles.faceGuide : styles.cardGuide}>
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                        <Text style={styles.cameraInstruction}>
                            {currentStep.instruction}
                        </Text>
                    </View>

                    {/* Botón de captura */}
                    <View style={styles.cameraFooter}>
                        <TouchableOpacity
                            style={styles.captureBtn}
                            onPress={takePicture}
                        >
                            <View style={styles.captureBtnInner} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Flash Effect */}
                {showFlash && <View style={styles.flashOverlay} />}

                {/* Success Overlay */}
                {showSuccessOverlay && (
                    <View style={styles.successOverlay}>
                        <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
                            <View style={styles.successBadge}>
                                <CheckCircle2 size={60} color="#10b981" />
                            </View>
                            <Text style={styles.successMainText}>{successMessage}</Text>
                        </Animated.View>
                    </View>
                )}

                <CustomAlertModal />
            </View>
        );
    }

    // Pantalla de verificación
    if (isVerifying) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <FloatingOrbs />
                <View style={styles.verifyContainer}>
                    <View style={styles.verifySpinner}>
                        <ActivityIndicator size="large" color="#6366f1" />
                    </View>
                    <Text style={styles.verifyTitle}>Verificando identidad</Text>
                    <Text style={styles.verifyText}>Analizando tus documentos...</Text>
                </View>
                <CustomAlertModal />
            </View>
        );
    }

    // Pantalla principal
    return (
        <LinearGradient
            colors={['#FFFFFF', '#e0e7ff', '#c7d2fe']}
            style={styles.container}
        >
            <StatusBar style="dark" />
            <FloatingOrbs />

            {/* Progress dots */}
            <View style={styles.progressDots}>
                {[1, 2, 3].map((dot) => (
                    <View
                        key={dot}
                        style={[
                            styles.dot,
                            dot === step && styles.dotActive,
                            dot < step && styles.dotComplete
                        ]}
                    />
                ))}
            </View>

            {/* Content SCROLLABLE */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    {/* Icon - Solo el icono, sin contenedor de fondo */}
                    <View style={styles.iconWrapper}>
                        <StepIcon size={80} color={currentStep.color} strokeWidth={1} />
                    </View>

                    {/* Title */}
                    <View style={styles.titleContainer}>
                        <Text style={styles.stepNumber}>Paso {step}/3</Text>
                        <Text style={styles.title}>{currentStep.title}</Text>
                        <Text style={[styles.subtitle, { color: currentStep.color }]}>
                            {currentStep.subtitle}
                        </Text>
                        <Text style={styles.mainInstructionText}>
                            {currentStep.instruction}
                        </Text>
                    </View>

                    {/* Photo preview */}
                    <View style={styles.photoContainer}>
                        {hasPhoto ? (
                            <View style={styles.photoPreview}>
                                <Image source={{ uri: photoUrl! }} style={styles.photo} />
                                <View style={styles.photoCheck}>
                                    <Shield size={20} color="#10b981" fill="#10b981" />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <View style={styles.placeholderIcon}>
                                    <StepIcon size={48} color="#475569" strokeWidth={1} />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Action button */}
                    <TouchableOpacity
                        style={[
                            styles.actionBtn,
                            { backgroundColor: currentStep.color },
                            isUploading && styles.actionBtnDisabled
                        ]}
                        onPress={handleCapture}
                        disabled={isUploading}
                        activeOpacity={0.8}
                    >
                        {isUploading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.actionBtnText}>
                                {hasPhoto ? '↻ Recapturar' : '📷 Capturar'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Continue button */}
                    {hasPhoto && (
                        <TouchableOpacity
                            style={styles.continueBtn}
                            onPress={() => {
                                if (step < 3) {
                                    setStep(step + 1);
                                } else {
                                    verifyKYC(frontIdUrl!, backIdUrl!, selfieUrl!);
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueBtnText}>
                                {step === 3 ? '✓ Finalizar' : 'Continuar →'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Success Overlay - Moved here to be visible after camera closes */}
            {showSuccessOverlay && (
                <View style={styles.successOverlay}>
                    <Animated.View style={[styles.successCard, { transform: [{ scale: successScale }] }]}>
                        <View style={styles.successBadge}>
                            <CheckCircle2 size={64} color="#10b981" />
                        </View>
                        <Text style={styles.successMainText}>{successMessage}</Text>
                    </Animated.View>
                </View>
            )}

            <CustomAlertModal />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    orb: {
        position: 'absolute',
        borderRadius: 1000,
    },
    progressDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingTop: 60,
        paddingBottom: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#334155',
    },
    dotActive: {
        width: 32,
        backgroundColor: '#8b5cf6',
    },
    dotComplete: {
        backgroundColor: '#10b981',
    },
    content: {
        width: '100%',
        paddingHorizontal: 32,
        paddingTop: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    iconWrapper: {
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Eliminado iconContainer anterior para quitar el fondo/circulo
    titleContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    mainInstructionText: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 22,
    },
    stepNumber: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    photoContainer: {
        width: '100%',
        marginBottom: 40,
    },
    photoPreview: {
        width: '100%',
        height: 240,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#10b981',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoCheck: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPlaceholder: {
        width: '100%',
        height: 240,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        borderWidth: 2,
        borderColor: '#334155',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderIcon: {
        opacity: 0.3,
    },
    actionBtn: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionBtnDisabled: {
        opacity: 0.6,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    continueBtn: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    continueBtnText: {
        color: '#0f172a',
        fontSize: 17,
        fontWeight: '600',
    },
    // Camera
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    cameraHeader: {
        paddingTop: 60,
        paddingHorizontal: 24,
        alignItems: 'flex-end',
    },
    cameraClose: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraCloseText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '300',
    },
    cameraCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardGuide: {
        width: width * 0.85,
        height: width * 0.55,
        marginBottom: 24,
    },
    faceGuide: {
        width: width * 0.7,
        height: width * 0.85,
        borderRadius: width * 0.35,
        marginBottom: 24,
    },
    corner: {
        position: 'absolute',
        width: 50,
        height: 50,
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#8b5cf6',
        borderTopLeftRadius: 12,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#8b5cf6',
        borderTopRightRadius: 12,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#8b5cf6',
        borderBottomLeftRadius: 12,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#8b5cf6',
        borderBottomRightRadius: 12,
    },
    cameraInstruction: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    cameraFooter: {
        paddingBottom: 50,
        alignItems: 'center',
    },
    captureBtn: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    captureBtnInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    // Verify
    verifyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    verifySpinner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    verifyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    verifyText: {
        fontSize: 16,
        color: '#64748b',
    },
    // Modal Styles
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 30,
    },
    overlayCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    overlayIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    overlayIcon: {
        fontSize: 40,
        color: 'white',
        fontWeight: 'bold',
    },
    overlayTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
        textAlign: 'center',
    },
    overlaySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    overlayButton: {
        backgroundColor: '#0026e3',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    overlayButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff',
        zIndex: 9999,
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    successCard: {
        width: width * 0.8,
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 40,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 20,
    },
    successBadge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successMainText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#064e3b',
        textAlign: 'center',
    },
});

