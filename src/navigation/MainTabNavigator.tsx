import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MapPin, QrCode } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import QRActionScreen from '../screens/QRActionScreen';
import PointsDiscoveryScreen from '../screens/PointsDiscoveryScreen';
import CashierDashboardScreen from '../screens/CashierDashboardScreen';
import CashierSetupScreen from '../screens/CashierSetupScreen';
import CashierBusinessHoursScreen from '../screens/CashierBusinessHoursScreen';
import { useCashierStore } from '../store/cashierStore';

const Tab = createBottomTabNavigator();
const Stack = createBottomTabNavigator(); // Actually we need a way to wrap the whole thing or switch

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TabBg = ({ color1, color2 }: { color1: string, color2: string }) => {
    // Geometría Concéntrica Matemática - Efecto Anillo / Halo
    // Ajustado al radio de 37.5 del botón y su offset vertical de 7.5px
    const curveWidth = 47;  // Radio horizontal para gap de 10px
    const curveHeight = 40; // Radio vertical compensado para gap de 10px arriba
    const barHeight = 70;
    const totalHeight = barHeight + curveHeight;
    const centerX = SCREEN_WIDTH / 2;

    // Constantes para circularidad (Bézier handles)
    const hTop = 26;  // Manejador horizontal superior
    const hBase = 15; // Manejador horizontal base (transición sutil)

    const d = `
        M0,${curveHeight} 
        L${centerX - curveWidth},${curveHeight} 
        C${centerX - curveWidth + hBase},${curveHeight} ${centerX - hTop},0 ${centerX},0
        C${centerX + hTop},0 ${centerX + curveWidth - hBase},${curveHeight} ${centerX + curveWidth},${curveHeight}
        L${SCREEN_WIDTH},${curveHeight} 
        L${SCREEN_WIDTH},${totalHeight} 
        L0,${totalHeight} 
        Z
    `;

    return (
        <View style={{ position: 'absolute', top: -curveHeight, left: 0, right: 0 }}>
            <Svg width={SCREEN_WIDTH} height={totalHeight} viewBox={`0 0 ${SCREEN_WIDTH} ${totalHeight}`}>
                <Defs>
                    <SvgGradient id="tabGradient" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor={color1} />
                        <Stop offset="1" stopColor={color2} />
                    </SvgGradient>
                </Defs>
                <Path d={d} fill="url(#tabGradient)" />
            </Svg>
        </View>
    );
};

function CustomTabBarButton({ children, onPress }: any) {
    return (
        <TouchableOpacity
            style={styles.customButtonContainer}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.customButton}>
                {children}
            </View>
        </TouchableOpacity>
    );
}

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
            {/* Fondo Unificado con Gradiente para toda la barra */}
            <LinearGradient
                colors={['#000833', '#0026e3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 0 }]}
            />

            {/* La Loma eliminada - Diseño plano con botón flotante */}

            <View style={styles.tabItemsRow}>
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    if (route.name === 'ScanQR') {
                        return (
                            <View key={route.key} style={{ flex: 1, alignItems: 'center' }}>
                                <CustomTabBarButton onPress={onPress}>
                                    <QrCode size={40} color="#000000" strokeWidth={2.5} />
                                </CustomTabBarButton>
                            </View>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                        >
                            {route.name === 'Inicio' ? (
                                <Home size={24} color={isFocused ? 'white' : 'rgba(255, 255, 255, 0.5)'} strokeWidth={2} />
                            ) : (
                                <MapPin size={24} color={isFocused ? 'white' : 'rgba(255, 255, 255, 0.5)'} strokeWidth={2} />
                            )}
                            <Text style={[styles.tabBarLabel, { color: isFocused ? 'white' : 'rgba(255, 255, 255, 0.5)' }]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export default function MainTabNavigator() {
    const { isCashierMode, registrationStatus } = useCashierStore();

    // If in Cashier Mode, we show a different set of tabs or a single dashboard
    // If in Cashier Mode, we show a different set of tabs or a single dashboard
    // REMOVED: Conditional return causing navigation trap.
    // if (isCashierMode) {
    //     return (
    //         <Tab.Navigator
    //             screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
    //         >
    //             <Tab.Screen name="CashierDashboard" component={CashierDashboardScreen} />
    //         </Tab.Navigator>
    //     );
    // }

    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Inicio" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
            <Tab.Screen name="ScanQR" component={QRActionScreen} options={{ tabBarLabel: 'Escanear' }} />
            <Tab.Screen name="Puntos" component={PointsDiscoveryScreen} options={{ tabBarLabel: 'Puntos Bolito' }} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0a1128',
    },
    tabBarGradient: {
        height: 70,
    },
    tabItemsRow: {
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    customButtonContainer: {
        top: -30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customButton: {
        width: 75,
        height: 75,
        borderRadius: 38,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#0026e3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 16,
    },
});
