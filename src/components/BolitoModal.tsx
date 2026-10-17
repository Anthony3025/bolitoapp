import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { ShieldCheck, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface BolitoModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'protected';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    showIcon?: boolean;
}

export default function BolitoModal({
    visible,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    confirmText = 'Continuar',
    cancelText = 'Cancelar',
    showCancel = false,
    showIcon = false
}: BolitoModalProps) {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={50} color="#10b981" />;
            case 'protected': return <ShieldCheck size={50} color="#10b981" />;
            case 'warning': return <AlertTriangle size={50} color="#f59e0b" />;
            case 'error': return <XCircle size={50} color="#ef4444" />;
            default: return <Info size={50} color="#0026e3" />;
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
                )}

                <Animated.View style={[
                    styles.modalContainer,
                    { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                ]}>
                    {showIcon && (
                        <View style={styles.iconWrapper}>
                            {getIcon()}
                        </View>
                    )}

                    <Text style={styles.title}>{title}</Text>
                    <Text style={[styles.message, !showIcon && { marginBottom: 20 }]}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {showCancel && (
                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.confirmButton, !showCancel && { width: '100%' }]}
                            onPress={onConfirm || onClose}
                        >
                            <LinearGradient
                                colors={type === 'protected' || type === 'success' ? ['#10b981', '#059669'] : ['#0026e3', '#0026e3']}
                                style={styles.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    iconWrapper: {
        marginBottom: 20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    confirmButton: {
        flex: 1,
        borderRadius: 15,
        overflow: 'hidden',
    },
    cancelButton: {
        flex: 1,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderRadius: 15,
        backgroundColor: '#f1f5f9',
    },
    gradient: {
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
