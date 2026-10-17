import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Image, Modal, FlatList, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Store, MapPin, Clock, Camera as CameraIcon, ShieldAlert, ChevronRight, Check, MapPin as MapPinIcon, ArrowLeftRight } from 'lucide-react-native';
import { useCashierStore } from '../store/cashierStore';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import BolitoModal from '../components/BolitoModal';

const { width, height } = Dimensions.get('window');

const FloatingOrbs = () => {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[styles.orb, { width: width * 1.5, height: width * 1.5, top: -width * 0.8, right: -width * 0.5, backgroundColor: '#e0e7ff', opacity: 0.1 }]} />
            <View style={[styles.orb, { width: width * 0.6, height: width * 0.6, bottom: height * 0.05, left: -width * 0.1, backgroundColor: '#818cf8', opacity: 0.05 }]} />
        </View>
    );
};

const CATEGORIES = [
    { id: 'tienda', name: 'Tienda de barrio', icon: '🏪' },
    { id: 'minimarket', name: 'Minimarket', icon: '🛒' },
    { id: 'farmacia', name: 'Farmacia', icon: '💊' },
    { id: 'pension', name: 'Pensión / Restaurante', icon: '🍲' },
    { id: 'ferreteria', name: 'Ferretería', icon: '🛠️' },
    { id: 'libreria', name: 'Librería / Papelería', icon: '📚' },
    { id: 'servicio', name: 'Taller / Servicios', icon: '🔧' },
    { id: 'otro', name: 'Otros Negocios', icon: '🛍️' },
];

export default function CashierSetupScreen({ navigation }: any) {
    const { businessData, updateBusinessData, setRegistrationStatus, setIsCashierMode } = useCashierStore();
    const user = useAuthStore((state) => state.user);
    const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);
    const [loadingLocation, setLoadingLocation] = React.useState(true);
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [isIdentityVerified, setIsIdentityVerified] = React.useState(false);
    const [isAnalyzingSelfie, setIsAnalyzingSelfie] = React.useState(false);
    const pulseAnim = React.useRef(new Animated.Value(0)).current;

    // Pulsating Border Loop
    React.useEffect(() => {
        if (isVerifying) { // Pulse All during Verification
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
                    Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(0);
        }
    }, [isVerifying]);

    const borderInterpolation = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 1)']
    });

    const mapRef = React.useRef<MapView>(null);

    // Custom Alert Modal State
    const [alertConfig, setAlertConfig] = React.useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'error' | 'success' | 'info' | 'warning';
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'success'
    });

    const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' | 'warning' = 'success', onConfirm?: () => void) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm });
    };

    // Camera state
    const [permission, requestPermission] = useCameraPermissions();
    const [showCamera, setShowCamera] = React.useState(false);
    const [cameraType, setCameraType] = React.useState<'selfie' | 'id_front' | 'id_back' | 'business'>('business');
    const [facing, setFacing] = React.useState<'back' | 'front'>('back');
    const cameraRef = React.useRef<CameraView>(null);

    // Validación de formulario completo
    const isFormComplete =
        businessData.name.trim().length > 0 &&
        businessData.category.length > 0 &&
        businessData.selfieUri &&
        businessData.idFrontUri &&
        businessData.idBackUri;

    const isFullFormComplete = isFormComplete && businessData.businessPhotoUri && isIdentityVerified;

    const uploadImage = async (uri: string, filename: string): Promise<string | null> => {
        try {
            // Leer la imagen como ArrayBuffer
            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();
            // @ts-ignore
            const fileData = new Uint8Array(arrayBuffer);

            const userId = user?.id || 'temp';
            const filePath = `merchant_verification/${userId}/${filename}`;

            const { data, error } = await supabase.storage
                .from('kyc-documents') // Bucket existente confirmado
                .upload(filePath, fileData, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error: any) {
            console.error('Upload error:', error);
            showAlert('Error de Subida', 'No se pudo subir la imagen para verificación.', 'error');
            return null;
        }
    };

    const handlePickImage = async (type: 'selfie' | 'id_front' | 'id_back' | 'business') => {
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permiso necesario', 'Necesitamos acceso a tu cámara para verificar tu punto.', 'warning');
                return;
            }
            setCameraType(type);
            setFacing(type === 'selfie' ? 'front' : 'back');
            setShowCamera(true);
        } catch (error) {
            showAlert('Error', 'No se pudo activar la cámara.', 'error');
        }
    };

    const handleCapture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.5,
                    shutterSound: true,
                });

                if (photo) {
                    const currentType = cameraType;
                    setShowCamera(false);

                    // 1. Subir Imagen
                    const uploadedUrl = await uploadImage(photo.uri, `${currentType}_${Date.now()}.jpg`);
                    if (!uploadedUrl) return; // If upload fails, stop here.

                    if (currentType === 'selfie') {
                        setIsAnalyzingSelfie(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                        // Simular análisis visual para feedback inmediato
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        updateBusinessData({ selfieUri: photo.uri });
                        setIsAnalyzingSelfie(false);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                    } else if (currentType === 'id_front') {
                        updateBusinessData({ idFrontUri: photo.uri });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } else if (currentType === 'id_back') {
                        updateBusinessData({ idBackUri: photo.uri });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } else {
                        updateBusinessData({ businessPhotoUri: photo.uri });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
            } catch (error) {
                console.error(error);
                setIsAnalyzingSelfie(false);
                showAlert('Error', 'Ocurrió un error en el proceso de captura.', 'error');
            }
        }
    };

    // --- AUTO-VERIFICACIÓN DE IDENTIDAD ---
    const verifyIdentity = async () => {
        if (isVerifying || isIdentityVerified) return;

        try {
            setIsVerifying(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Feedback táctil de inicio

            const uploadFile = async (uri: string, prefix: string) => {
                return await uploadImage(uri, `${prefix}_${user?.id}_${Date.now()}.jpg`);
            };

            const [selfieUrl, idFrontUrl, idBackUrl] = await Promise.all([
                uploadFile(businessData.selfieUri!, 'selfie'),
                uploadFile(businessData.idFrontUri!, 'id_front'),
                uploadFile(businessData.idBackUri!, 'id_back')
            ]);

            if (!selfieUrl || !idFrontUrl || !idBackUrl) throw new Error("Error subiendo imágenes.");

            const { data, error } = await supabase.functions.invoke('verify-merchant-identity', {
                body: { user_id: user?.id, selfie_url: selfieUrl, id_front_url: idFrontUrl, id_back_url: idBackUrl }
            });

            if (error || (data && data.status === 'rejected')) {
                throw new Error(data?.reason || "Verificación fallida.");
            }

            // ÉXITO
            setIsIdentityVerified(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showAlert("¡Identidad Verificada!", "Los datos coinciden correctamente. Ahora captura la fachada de tu negocio.", "success");

        } catch (error: any) {
            // Logueamos internamente sin mostrar el box rojo en Expo
            console.log("Verification error (silenced):", error.message);

            // Resetear fotos si falla para obligar a re-toma
            updateBusinessData({
                selfieUri: undefined,
                idFrontUri: undefined,
                idBackUri: undefined
            });
            showAlert("Error de Verificación", "No pudimos validar tu identidad", "error");
            setIsIdentityVerified(false);
        } finally {
            setIsVerifying(false);
        }
    };

    // Trigger Automático
    React.useEffect(() => {
        if (businessData.selfieUri && businessData.idFrontUri && businessData.idBackUri && !isIdentityVerified && !isVerifying) {
            verifyIdentity();
        }
    }, [businessData.selfieUri, businessData.idFrontUri, businessData.idBackUri]);

    React.useEffect(() => {
        (async () => {
            try {
                setLoadingLocation(true);

                // 1. Verificar servicios de ubicación
                const enabled = await Location.hasServicesEnabledAsync();
                if (!enabled) {
                    showAlert('Ubicación Desactivada', 'Activa el GPS para registrar tu punto.', 'warning');
                    setLoadingLocation(false);
                    return;
                }

                // 2. Solicitar permisos
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    showAlert('Permiso Denegado', 'Bólito necesita tu ubicación para registrar el punto.', 'error');
                    setLoadingLocation(false);
                    return;
                }

                // 3. Obtener ubicación precisa
                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

                const newCoords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                };

                updateBusinessData({ coords: newCoords });

                // Centrar mapa
                mapRef.current?.animateToRegion({
                    ...newCoords,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }, 1000);

            } catch (error) {
                console.error('Error configurando ubicación:', error);
            } finally {
                setLoadingLocation(false);
            }
        })();
    }, []);

    const handleActivate = async () => {
        if (!isFullFormComplete) {
            showAlert('Falta completar pasos', 'Asegúrate de tener la identidad verificada y la foto del negocio.', 'info');
            return;
        }

        try {
            // 3. PERSISTENCIA REAL: Guardar estado en Base de Datos de Perfiles
            const { error: dbError } = await supabase
                .from('profiles')
                .update({
                    is_cashier: true,
                    cashier_activated_at: new Date().toISOString(),
                })
                .eq('id', user?.id);

            if (dbError) {
                console.log("Error de persistencia en perfil:", dbError.message);
            }

            // 4. VISIBILIDAD PÚBLICA: Guardar en tabla de Puntos Bolito
            const { error: pointError } = await supabase
                .from('cashier_points')
                .upsert({
                    owner_id: user?.id,
                    name: businessData.name,
                    category: businessData.category,
                    address: businessData.address,
                    latitude: businessData.coords.latitude,
                    longitude: businessData.coords.longitude,
                    is_active: true
                }, { onConflict: 'owner_id' });

            if (pointError) {
                console.log("Error publicando punto de cajero:", pointError.message);
            }

            setRegistrationStatus('active');
            setIsCashierMode(true);

            showAlert(
                "¡Punto Activado!",
                "Bienvenido a la red Bolito. Ya puedes operar.",
                'success',
                () => navigation.replace('CashierDashboard')
            );
        } catch (error) {
            console.log("Activation error:", error);
            showAlert("Error Activando", "Hubo un problema guardando tu registro.", 'error');
        }
    };

    const selectCategory = (cat: any) => {
        updateBusinessData({ category: cat.name });
        setShowCategoryPicker(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <FloatingOrbs />

            {isVerifying && (
                <View style={styles.verifyingOverlay}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.verifyingTitle}>Verificando identidad</Text>
                    <Text style={styles.verifyingText}>Analizando tus documentos...</Text>
                </View>
            )}

            <LinearGradient
                colors={['#000833', '#0026e3']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={28} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Configurar Punto</Text>
                        <Text style={styles.headerSubtitle}>Ajustes de seguridad y operación</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Nombre y Categoría */}
                <View style={styles.section}>
                    <View style={styles.inputGroup}>
                        <View style={styles.inputHeader}>
                            <Store size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                            <Text style={styles.inputLabel}>NOMBRE DEL PUNTO</Text>
                        </View>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ej: Punto Bolito Central"
                            placeholderTextColor="#64748b"
                            value={businessData.name}
                            onChangeText={(val) => updateBusinessData({ name: val })}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.selectorItem}
                        onPress={() => setShowCategoryPicker(true)}
                    >
                        <View style={styles.selectorLeft}>
                            <View style={styles.iconBox}>
                                <Text style={{ fontSize: 18 }}>
                                    {CATEGORIES.find(c => c.name === businessData.category)?.icon || '🛍️'}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.selectorLabel}>CATEGORÍA DEL LUGAR</Text>
                                <Text style={styles.selectorValue}>
                                    {businessData.category || 'Seleccionar categoría...'}
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

                {/* Ubicación */}
                <View style={styles.section}>
                    <Text style={styles.addressText}>{businessData.address || 'Ubicación detectada automáticamente'}</Text>

                    <View style={styles.mapContainer}>
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            initialRegion={{
                                latitude: businessData.coords.latitude,
                                longitude: businessData.coords.longitude,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                            showsUserLocation={true}
                            showsMyLocationButton={true}
                        >
                            <Marker
                                coordinate={businessData.coords}
                                draggable
                                onDragEnd={(e) => {
                                    updateBusinessData({ coords: e.nativeEvent.coordinate });
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                }}
                                title="Ubicación de tu Negocio"
                                description="Mantén presionado para arrastrar"
                            />
                        </MapView>
                        {loadingLocation && (
                            <View style={styles.mapLoading}>
                                <ActivityIndicator color="#0026e3" size="large" />
                                <Text style={styles.mapLoadingText}>Detectando tu ubicación...</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.mapHint}>Mantén presionado el marcador para ajustarlo a tu puerta.</Text>
                </View>

                {/* Horarios */}
                <TouchableOpacity
                    style={styles.sectionItem}
                    onPress={() => navigation.navigate('CashierBusinessHours')}
                >
                    <View style={styles.selectorLeft}>
                        <View style={styles.iconBox}>
                            <Clock size={20} color="#3b82f6" />
                        </View>
                        <View>
                            <Text style={styles.selectorTitle}>Horarios de atención</Text>
                            <Text style={styles.selectorSubtitle}>Configura las horas de atención</Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color="#64748b" />
                </TouchableOpacity>

                {/* Verificación KYC */}
                <View style={styles.section}>
                    <View style={styles.inputHeader}>
                        <CameraIcon size={18} color="#3b82f6" style={{ marginRight: 10 }} />
                        <Text style={styles.inputLabel}>VERIFIQUEMOS TU IDENTIDAD</Text>
                    </View>


                    {/* Botones de fotos */}
                    <View style={{ gap: 15 }}>
                        {/* 1. Selfie */}
                        <TouchableOpacity
                            style={[
                                styles.kycButton,
                                businessData.selfieUri && styles.kycButtonActive,
                                isAnalyzingSelfie && {
                                    backgroundColor: 'transparent',
                                    borderColor: 'transparent'
                                }
                            ]}
                            onPress={() => handlePickImage('selfie')}
                            disabled={isAnalyzingSelfie}
                        >
                            {isVerifying && (
                                <Animated.View style={[
                                    StyleSheet.absoluteFill,
                                    { borderRadius: 20, borderWidth: 2, borderColor: borderInterpolation }
                                ]} />
                            )}
                            <View style={styles.kycIconBox}>
                                {isAnalyzingSelfie ? (
                                    <ActivityIndicator color="#3b82f6" />
                                ) : businessData.selfieUri ? (
                                    <Image source={{ uri: businessData.selfieUri }} style={styles.previewImage} />
                                ) : (
                                    <CameraIcon size={24} color="#3b82f6" />
                                )}
                            </View>
                            <View style={styles.kycContent}>
                                <Text style={styles.kycTitle}>
                                    {isVerifying ? 'Verificando...' : businessData.selfieUri ? '✅ Selfie Capturada' : '1. Selfie de Verificación'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* 2. CI Anverso */}
                        <TouchableOpacity
                            style={[
                                styles.kycButton,
                                businessData.idFrontUri && styles.kycButtonActive,
                                isVerifying && { backgroundColor: 'transparent' }
                            ]}
                            onPress={() => handlePickImage('id_front')}
                            disabled={isVerifying || isIdentityVerified}
                        >
                            {isVerifying && (
                                <Animated.View style={[
                                    StyleSheet.absoluteFill,
                                    { borderRadius: 20, borderWidth: 2, borderColor: borderInterpolation }
                                ]} />
                            )}
                            <View style={styles.kycIconBox}>
                                {businessData.idFrontUri ? (
                                    <Image source={{ uri: businessData.idFrontUri }} style={styles.previewImage} />
                                ) : (
                                    <View style={{ borderWidth: 1, borderColor: '#3b82f6', borderRadius: 4, width: 24, height: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 8, color: '#3b82f6' }}>F</Text></View>
                                )}
                            </View>
                            <View style={styles.kycContent}>
                                <Text style={styles.kycTitle}>
                                    {isVerifying ? 'Verificando...' : businessData.idFrontUri ? '✅ CI Anverso Listo' : '2. Foto Carnet (Frente)'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* 3. CI Reverso */}
                        <TouchableOpacity
                            style={[
                                styles.kycButton,
                                businessData.idBackUri && styles.kycButtonActive,
                                isVerifying && { backgroundColor: 'transparent' }
                            ]}
                            onPress={() => handlePickImage('id_back')}
                            disabled={isVerifying || isIdentityVerified}
                        >
                            {isVerifying && (
                                <Animated.View style={[
                                    StyleSheet.absoluteFill,
                                    { borderRadius: 20, borderWidth: 2, borderColor: borderInterpolation }
                                ]} />
                            )}
                            <View style={styles.kycIconBox}>
                                {businessData.idBackUri ? (
                                    <Image source={{ uri: businessData.idBackUri }} style={styles.previewImage} />
                                ) : (
                                    <View style={{ borderWidth: 1, borderColor: '#3b82f6', borderRadius: 4, width: 24, height: 16, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}><Text style={{ fontSize: 8, color: '#3b82f6' }}>R</Text></View>
                                )}
                            </View>
                            <View style={styles.kycContent}>
                                <Text style={styles.kycTitle}>
                                    {isVerifying ? 'Verificando...' : businessData.idBackUri ? '✅ CI Reverso Listo' : '3. Foto Carnet (Atrás)'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* 4. Foto Negocio */}
                        <TouchableOpacity
                            style={[
                                styles.kycButton,
                                businessData.businessPhotoUri && styles.kycButtonActive,
                                !isIdentityVerified && { opacity: 0.5, backgroundColor: '#0f172a', borderColor: '#334155' } // Disabled look
                            ]}
                            onPress={() => handlePickImage('business')}
                            disabled={!isIdentityVerified}
                        >
                            <View style={styles.kycIconBox}>
                                {businessData.businessPhotoUri ? (
                                    <Image source={{ uri: businessData.businessPhotoUri }} style={styles.previewImage} />
                                ) : (
                                    <Store size={24} color={isIdentityVerified ? "#3b82f6" : "#64748b"} />
                                )}
                            </View>
                            <View style={styles.kycContent}>
                                <Text style={[styles.kycTitle, !isIdentityVerified && { color: '#64748b' }]}>
                                    {businessData.businessPhotoUri ? '✅ Foto de Negocio Lista' : '4. Foto Frontal del Negocio'}
                                </Text>
                                <Text style={[styles.kycSubtitle, !isIdentityVerified && { color: '#475569' }]}>
                                    {isIdentityVerified ? 'Asegúrate de que se vea el letrero' : 'Completa verificación para desbloquear'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Seguridad Proximidad */}
                <View style={[styles.section, styles.securityBox]}>
                    <View style={styles.securityHeader}>
                        <ShieldAlert size={20} color="#ef4444" style={{ marginRight: 10 }} />
                        <Text style={styles.securityTitle}>SEGURIDAD DE PROXIMIDAD</Text>
                    </View>
                    <Text style={styles.securityText}>
                        Para garantizar la validez de las operaciones, si la aplicación detecta tu ubicación a más de <Text style={styles.boldText}>10 metros</Text> de la dirección registrada, el Modo Cajero se activará un protocolo de apagado automático instantáneo.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.activateButton, !isFullFormComplete && styles.activateButtonDisabled]}
                    onPress={handleActivate}
                >
                    <Text style={styles.activateButtonText}>ACTIVAR PUNTO</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Category Picker Modal */}
            <Modal
                visible={showCategoryPicker}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Selecciona una Categoría</Text>
                            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                                <Text style={styles.closeBtn}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={CATEGORIES}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.catItem,
                                        businessData.category === item.name && styles.catItemActive
                                    ]}
                                    onPress={() => selectCategory(item)}
                                >
                                    <View style={styles.catLeft}>
                                        <Text style={styles.catIcon}>{item.icon}</Text>
                                        <Text style={styles.catName}>{item.name}</Text>
                                    </View>
                                    {businessData.category === item.name && (
                                        <Check size={20} color="#3b82f6" strokeWidth={3} />
                                    )}
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingBottom: 30 }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal de Cámara Instantánea */}
            <Modal
                visible={showCamera}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowCamera(false)}
            >
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing={facing}
                        autofocus="on"
                    >
                        <View style={styles.cameraOverlay}>
                            <View style={styles.cameraTopBar}>
                                <TouchableOpacity
                                    style={styles.closeCameraBtn}
                                    onPress={() => setShowCamera(false)}
                                >
                                    <ChevronLeft color="white" size={30} />
                                </TouchableOpacity>

                                {/* Botón de giro eliminado por seguridad operativa */}
                            </View>

                            <View style={styles.cameraHeader}>
                                <Text style={styles.cameraTitle}>
                                    {cameraType === 'selfie' ? 'Selfie de Verificación' :
                                        cameraType === 'id_front' ? 'Foto Carnet (Frente)' :
                                            cameraType === 'id_back' ? 'Foto Carnet (Atrás)' :
                                                'Foto del Negocio'}
                                </Text>
                                <Text style={styles.cameraHint}>
                                    {cameraType === 'selfie' ? 'Asegúrate de que tu rostro sea visible' :
                                        cameraType === 'id_front' ? 'Encuadra el lado frontal de tu CI' :
                                            cameraType === 'id_back' ? 'Encuadra el reverso de tu CI' :
                                                'Captura la fachada frontal de tu local'}
                                </Text>
                            </View>

                            <View style={styles.cameraControls}>
                                <TouchableOpacity
                                    style={styles.captureBtn}
                                    onPress={handleCapture}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.captureBtnInner}>
                                        <CameraIcon color="#0026e3" size={32} strokeWidth={2.5} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </CameraView>
                </View>
            </Modal>

            <BolitoModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => {
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                }}
                showIcon={true}
                confirmText="Entendido"
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a1128',
    },
    header: {
        height: 140,
        paddingTop: 50,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    section: {
        backgroundColor: '#111b3d',
        borderRadius: 25,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 1,
    },
    textInput: {
        fontSize: 17,
        color: 'white',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 12,
    },
    selectorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    selectorLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 0.5,
    },
    selectorValue: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
        marginTop: 2,
    },
    addressText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
        marginBottom: 15,
    },
    mapContainer: {
        height: 250,
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#0a1128',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 17, 40, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    mapLoadingText: {
        color: 'white',
        fontSize: 14,
        marginTop: 10,
        fontWeight: '500',
    },
    mapHint: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        marginTop: 12,
    },
    sectionItem: {
        backgroundColor: '#111b3d',
        borderRadius: 25,
        padding: 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    selectorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    selectorSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
    },
    infoAlert: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    infoAlertText: {
        fontSize: 13,
        color: '#93c5fd',
        lineHeight: 18,
    },
    kycButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    kycButtonActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderStyle: 'solid',
        borderColor: '#10b981',
    },
    kycButtonAnalyzing: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderStyle: 'solid',
        borderColor: 'rgba(59, 130, 246, 0.5)',
    },
    kycIconBox: {
        width: 55,
        height: 55,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        overflow: 'hidden',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    kycContent: {
        flex: 1,
    },
    kycTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: 'white',
    },
    kycSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
    },
    securityBox: {
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    securityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    securityTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#ef4444',
        letterSpacing: 0.5,
    },
    securityText: {
        fontSize: 12,
        color: '#fca5a5',
        lineHeight: 18,
    },
    boldText: {
        fontWeight: 'bold',
        color: 'white',
    },
    activateButton: {
        backgroundColor: '#0026e3',
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        bottom: 20,
    },
    activateButtonDisabled: {
        backgroundColor: '#1e293b',
        opacity: 0.6,
    },
    activateButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        backgroundColor: '#1e293b',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        maxHeight: '80%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    closeBtn: {
        color: '#3b82f6',
        fontWeight: 'bold',
        fontSize: 16,
    },
    catItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 15,
        borderRadius: 15,
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    catItemActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    catLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    catIcon: {
        fontSize: 24,
        marginRight: 15,
    },
    catName: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
    },
    // Estilos de Cámara
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'space-between',
        padding: 30,
        paddingTop: 60,
    },
    closeCameraBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraHeader: {
        alignItems: 'center',
    },
    cameraTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    cameraHint: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    cameraControls: {
        alignItems: 'center',
        marginBottom: 20,
    },
    captureBtn: {
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 4,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    captureBtnInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraTopBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    flipCameraBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Estilos KYC Extras
    orb: {
        position: 'absolute',
        borderRadius: 1000,
    },
    verifyingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 17, 40, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    verifyingTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
    },
    verifyingText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
