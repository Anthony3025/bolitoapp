import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform, ActivityIndicator } from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    useCodeScanner,
    useCameraFormat,
    CameraPosition
} from 'react-native-vision-camera';
import { X, Flashlight, FlashlightOff, Image as ImageIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCashierStore } from '../store/cashierStore';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jsQR from 'jsqr';
import * as jpeg from 'jpeg-js';
import { Buffer } from 'buffer';

const { width, height } = Dimensions.get('window');

export default function QRScannerScreen({ navigation }: any) {
    const { hasPermission, requestPermission } = useCameraPermission();
    const [scanned, setScanned] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const device = useCameraDevice('back');
    const format = useCameraFormat(device, [
        { videoResolution: { width: 1280, height: 720 } },
        { fps: 30 }
    ]);
    const isScanning = useRef(false);
    const isCashierMode = useCashierStore((state) => state.isCashierMode);

    // Resetear el bloqueo cuando el estado de scanned cambia a false
    useEffect(() => {
        if (!scanned) {
            isScanning.current = false;
        }
    }, [scanned]);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission]);

    // OPTIMIZACIÓN MÁXIMA: Detección pura nativa
    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes) => {
            if (isScanning.current || codes.length === 0) return;

            const data = codes[0].value;
            if (!data) return;

            isScanning.current = true;
            setScanned(true);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            try {
                const parsed = JSON.parse(data);
                if (isCashierMode && (parsed.type === 'dynamic_user_qr' || parsed.type === 'cashier_operation')) {
                    navigation.replace('CashierProcess', { qrData: data });
                    return;
                }
            } catch (e) { }

            // NAVIGATION PRO: Usar replace para evitar que el botón atrás regrese al escáner
            // FIX: Pasar el monto bloqueado si existe en el QR
            try {
                const parsed = JSON.parse(data);
                if (parsed.amount) {
                    navigation.replace('PaymentConfirm', { qrData: data, lockedAmount: parsed.amount });
                    return;
                }
            } catch (e) { }

            navigation.replace('PaymentConfirm', { qrData: data });
        }
    });

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // Quitar recorte manual para mejor UX
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];

                // OPTIMIZACIÓN ULTRA: 200px es instantáneo y perfecto para QR
                const manipulated = await manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 200 } }],
                    { base64: true, format: SaveFormat.JPEG, compress: 0.5 }
                );

                if (manipulated.base64) {
                    const buffer = Buffer.from(manipulated.base64, 'base64');
                    const rawData = jpeg.decode(buffer, { useTArray: true });
                    const code = jsQR(new Uint8ClampedArray(rawData.data), rawData.width, rawData.height);

                    if (code) {
                        isScanning.current = true;
                        setScanned(true);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        // NAVIGATION PRO: Usar replace para flujo continuo
                        // FIX: Pasar el monto bloqueado si existe en el QR de imagen
                        try {
                            const parsed = JSON.parse(code.data);
                            if (parsed.amount) {
                                navigation.replace('PaymentConfirm', { qrData: code.data, lockedAmount: parsed.amount });
                            } else {
                                navigation.replace('PaymentConfirm', { qrData: code.data });
                            }
                        } catch (e) {
                            navigation.replace('PaymentConfirm', { qrData: code.data });
                        }
                    } else {
                        Alert.alert('No se detectó QR', 'Asegúrate de que el código QR sea visible en la foto.');
                    }
                }
            }
        } catch (error) {
            console.log('Error decoding gallery:', error);
        }
    };

    if (!hasPermission) return <View style={styles.container}><Text style={styles.messageText}>Permiso de cámara... </Text></View>;
    if (!device) return <View style={styles.container}><Text style={styles.messageText}>Cámara no encontrada.</Text></View>;

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                format={format}
                isActive={!scanned}
                codeScanner={codeScanner}
                torch={flashOn ? 'on' : 'off'}
                enableZoomGesture
                audio={false}
                videoHdr={false}
                photoHdr={false}
                videoStabilizationMode="off" // Desactivar para ganar velocidad
            />

            <LinearGradient
                colors={['rgba(0, 8, 51, 0.9)', 'transparent']}
                style={styles.header}
            >
                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                    <X size={28} color="white" strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Escanear QR</Text>
                <TouchableOpacity style={styles.flashButton} onPress={() => setFlashOn(!flashOn)}>
                    {flashOn ? <Flashlight size={24} color="white" strokeWidth={2} /> : <FlashlightOff size={24} color="white" strokeWidth={2} />}
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.overlay}>
                <View style={styles.scanArea}>
                    {scanned ? (
                        null
                    ) : (
                        <>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </>
                    )}
                </View>
            </View>

            <LinearGradient
                colors={['transparent', 'rgba(0, 8, 51, 0.95)']}
                style={styles.footer}
            >
                <TouchableOpacity style={styles.galleryButton} onPress={pickImage} activeOpacity={0.8}>
                    <View style={styles.galleryIconCircle}>
                        <ImageIcon size={20} color="#000833" strokeWidth={2.5} />
                    </View>
                    <Text style={styles.galleryText}>Subir imagen</Text>
                </TouchableOpacity>

                {scanned && (
                    <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)}>
                        <Text style={styles.scanAgainText}>Escanear de nuevo</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>
        </View>
    );
}

const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20
    },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    flashButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanArea: { width: scanAreaSize, height: scanAreaSize, position: 'relative' },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: '#0026e3', borderWidth: 4 },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
    scannedContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 38, 227, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    scannedText: { color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
    processingText: { color: 'white', fontSize: 14, marginTop: 10, opacity: 0.8 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 100, paddingTop: 40, paddingHorizontal: 20, alignItems: 'center' },
    galleryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    galleryIconCircle: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'white',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 10,
    },
    galleryText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    scanAgainButton: { marginTop: 20, backgroundColor: '#0026e3', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 25 },
    scanAgainText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    messageText: { fontSize: 18, color: 'white', textAlign: 'center' },
});
