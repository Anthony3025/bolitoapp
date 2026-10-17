import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useCashierStore } from '../store/cashierStore';

export default function CashierBusinessHoursScreen({ navigation }: any) {
    const { businessData, updateBusinessData } = useCashierStore();
    const [showTimePicker, setShowTimePicker] = React.useState(false);
    const [pickerMode, setPickerMode] = React.useState<'hours' | 'minutes'>('hours');
    const [selectedHour, setSelectedHour] = React.useState('9');
    const [selectedMinute, setSelectedMinute] = React.useState('00');

    const toggleDay = (day: string) => {
        const newHours = businessData.hours.map(h =>
            h.day === day ? { ...h, enabled: !h.enabled } : h
        );
        updateBusinessData({ hours: newHours });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <LinearGradient
                colors={['#000833', '#0026e3']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color="white" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Horarios de atención</Text>
                    <Text style={styles.headerSubtitle}>Define tus horas de atención</Text>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 50, paddingTop: 20 }}
            >
                {businessData.hours.map((item, index) => (
                    <View key={item.day} style={styles.dayCard}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayName}>{item.day}</Text>
                            <Switch
                                value={item.enabled}
                                onValueChange={() => toggleDay(item.day)}
                                trackColor={{ false: '#1e293b', true: '#10b981' }}
                                thumbColor={item.enabled ? 'white' : '#64748b'}
                            />
                        </View>

                        {item.enabled && (
                            <View style={styles.hoursRow}>
                                <TouchableOpacity
                                    style={styles.timeBox}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <View style={styles.timeLabelBox}>
                                        <Text style={styles.timeLabel}>Abrir</Text>
                                    </View>
                                    <Text style={styles.timeText}>{item.open}</Text>
                                </TouchableOpacity>

                                <Text style={styles.separator}>-</Text>

                                <TouchableOpacity
                                    style={styles.timeBox}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <View style={styles.timeLabelBox}>
                                        <Text style={styles.timeLabel}>Cerrar</Text>
                                    </View>
                                    <Text style={styles.timeText}>{item.close}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {item.enabled && (
                            <TouchableOpacity style={styles.addHourBtn}>
                                <Plus size={16} color="#10b981" style={{ marginRight: 6 }} />
                                <Text style={styles.addHourText}>Añadir horario</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Time Picker Modal Overlay (Simulated) */}
            <Modal
                transparent
                visible={showTimePicker}
                animationType="fade"
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTimePicker(false)}
                >
                    <View style={styles.pickerCard}>
                        <View style={styles.pickerHeader}>
                            <View style={styles.timeDisplayRow}>
                                <TouchableOpacity onPress={() => setPickerMode('hours')}>
                                    <Text style={[styles.pickerTime, pickerMode === 'hours' && styles.pickerTimeActive]}>
                                        {selectedHour}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.timeSeparator}>:</Text>
                                <TouchableOpacity onPress={() => setPickerMode('minutes')}>
                                    <Text style={[styles.pickerTime, pickerMode === 'minutes' && styles.pickerTimeActive]}>
                                        {selectedMinute}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.pickerClockContainer}>
                            <View style={styles.clockCircle}>
                                {pickerMode === 'hours' ? (
                                    [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => (
                                        <TouchableOpacity
                                            key={num}
                                            style={[styles.clockNumContainer, {
                                                left: 85 + 75 * Math.sin((i * 30) * Math.PI / 180),
                                                top: 85 - 75 * Math.cos((i * 30) * Math.PI / 180),
                                            }]}
                                            onPress={() => {
                                                setSelectedHour(num.toString());
                                                setPickerMode('minutes');
                                            }}
                                        >
                                            <Text style={[styles.clockNum, selectedHour === num.toString() && styles.clockNumActive]}>
                                                {num}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((num, i) => (
                                        <TouchableOpacity
                                            key={num}
                                            style={[styles.clockNumContainer, {
                                                left: 85 + 75 * Math.sin((i * 30) * Math.PI / 180),
                                                top: 85 - 75 * Math.cos((i * 30) * Math.PI / 180),
                                            }]}
                                            onPress={() => setSelectedMinute(num)}
                                        >
                                            <Text style={[styles.clockNum, selectedMinute === num && styles.clockNumActive]}>
                                                {num}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                                <View style={[styles.clockHandContainer, {
                                    transform: [{ rotate: `${(pickerMode === 'hours' ? parseInt(selectedHour) % 12 : parseInt(selectedMinute) / 5) * 30}deg` }]
                                }]}>
                                    <View style={styles.clockCenter} />
                                    <View style={styles.clockHand} />
                                    <View style={styles.clockHandEnd} />
                                </View>
                            </View>
                        </View>

                        <View style={styles.pickerActions}>
                            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                <Text style={styles.pickerActionCancel}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                <Text style={styles.pickerActionAccept}>ACEPTAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        marginRight: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    dayCard: {
        marginBottom: 25,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    dayName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    hoursRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeBox: {
        flex: 1,
        backgroundColor: '#111b3d',
        height: 60,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    timeLabelBox: {
        position: 'absolute',
        top: -8,
        left: 15,
        backgroundColor: '#0a1128',
        paddingHorizontal: 8,
    },
    timeLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    timeText: {
        fontSize: 18,
        color: 'white',
        fontWeight: '600',
    },
    separator: {
        paddingHorizontal: 15,
        color: 'white',
        fontSize: 20,
    },
    addHourBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    addHourText: {
        fontSize: 15,
        color: '#10b981',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerCard: {
        width: 320,
        backgroundColor: '#111b3d',
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    pickerHeader: {
        backgroundColor: '#0026e3',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeDisplayRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerTime: {
        fontSize: 68,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    pickerTimeActive: {
        color: 'white',
    },
    timeSeparator: {
        fontSize: 60,
        color: 'white',
        marginHorizontal: 10,
        opacity: 0.8,
    },
    pickerClockContainer: {
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clockCircle: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: '#1e293b',
        position: 'relative',
    },
    clockNumContainer: {
        position: 'absolute',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    clockNum: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 17,
        fontWeight: '500',
    },
    clockNumActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    clockHandContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clockCenter: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
        zIndex: 5,
    },
    clockHand: {
        position: 'absolute',
        width: 2,
        height: 85,
        backgroundColor: '#3b82f6',
        bottom: '50%',
    },
    clockHandEnd: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        top: 15,
        zIndex: 4,
    },
    pickerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        gap: 25,
    },
    pickerActionCancel: {
        color: '#94a3b8',
        fontWeight: 'bold',
        fontSize: 15,
    },
    pickerActionAccept: {
        color: '#3b82f6',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
