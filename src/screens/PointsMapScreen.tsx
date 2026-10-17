import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Linking, StatusBar as RNStatusBar, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MapPin, Star, Navigation, ShieldCheck } from 'lucide-react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_APIKEY = 'AIzaSyAnYstritrIdmCs7dYTxAmLSpwqXPJU01A';

export default function PointsMapScreen({ route, navigation }: any) {
    const CustomMarker = ({ active }: { active: boolean }) => (
        <View style={styles.markerWrapper}>
            {active && <View style={styles.markerPulse} />}
            <View style={styles.markerColumn}>
                <LinearGradient
                    colors={active ? ['#00ffff', '#0026e3'] : ['#000033', '#000000']}
                    style={[styles.creativeMarker, active && styles.creativeMarkerActive]}
                >
                    <View style={styles.markerIconInner}>
                        <MapPin size={active ? 16 : 12} color="white" fill={active ? "white" : "transparent"} />
                    </View>
                </LinearGradient>
                <View style={[styles.markerTip, active && { borderTopColor: '#00ffff' }]} />
            </View>
        </View>
    );

    const [userLocation, setUserLocation] = useState<any>(null);
    const [points, setPoints] = useState<any[]>([]);
    const [selectedPoint, setSelectedPoint] = useState<any>(null);
    const [showRoute, setShowRoute] = useState(false);
    const [fallbackPolyline, setFallbackPolyline] = useState<any[]>([]);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoadingLocation(true);

                // 1. Verificar servicios de ubicación
                const enabled = await Location.hasServicesEnabledAsync();
                if (!enabled) {
                    Alert.alert(
                        'Ubicación Desactivada',
                        'Por favor, activa los servicios de ubicación en tu dispositivo para ver los Puntos Bolito cercanos.'
                    );
                    setLoadingLocation(false);
                    return;
                }

                // 2. Solicitar permisos
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permiso Denegado',
                        'Bolito necesita acceso a tu ubicación para mostrarte los puntos más cercanos y trazar rutas.'
                    );
                    setLoadingLocation(false);
                    return;
                }

                // 3. Obtener última ubicación conocida (rápido)
                let lastLocation = await Location.getLastKnownPositionAsync({});
                if (lastLocation) {
                    updateUserAndDemoPoints(lastLocation.coords);
                }

                // 4. Obtener ubicación precisa (puede tardar más)
                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                updateUserAndDemoPoints(location.coords);

            } catch (error) {
                console.error('Error obteniendo ubicación:', error);
                Alert.alert('Error', 'No pudimos detectar tu ubicación actual.');
            } finally {
                setLoadingLocation(false);
            }
        })();
    }, []);

    const updateUserAndDemoPoints = (coords: any) => {
        const { latitude, longitude } = coords;
        setUserLocation({ latitude, longitude });

        // Punto principal: Doña Luz a 700m
        const deg700m = 700 / 111000;
        const localizedDonaLuz = {
            id: 1,
            name: 'Doña Luz',
            dist: '700m',
            rating: 4.8,
            services: ['RETIRO', 'DEPÓSITO'],
            latitude: latitude + deg700m,
            longitude: longitude + deg700m,
            address: 'Av. Principal #123 (Cerca de ti)'
        };

        // Generar 4 puntos adicionales aleatorios dentro de un radio de 2km
        const otherPoints = [
            { id: 2, name: 'Minimarket El Sol', rating: 4.5, services: ['DEPÓSITO'], address: 'Calle 15 de Calacoto' },
            { id: 3, name: 'Farmacia San José', rating: 4.9, services: ['RETIRO'], address: 'Av. Ballivián #45' },
            { id: 4, name: 'Tienda Don Pepe', rating: 4.2, services: ['RETIRO', 'DEPÓSITO'], address: 'Calle Sagarnaga #789' },
            { id: 5, name: 'Punto Express', rating: 4.0, services: ['DEPÓSITO'], address: 'Av. Arce #2345' },
        ].map(p => {
            // Generar desplazamiento aleatorio entre 500m y 2000m
            const radius = (500 + Math.random() * 1500) / 111000;
            const angle = Math.random() * Math.PI * 2;
            const latOffset = Math.sin(angle) * radius;
            const lngOffset = Math.cos(angle) * radius;

            return {
                ...p,
                latitude: latitude + latOffset,
                longitude: longitude + lngOffset,
                dist: `${Math.round(radius * 111000)}m`
            };
        });

        const allPoints = [localizedDonaLuz, ...otherPoints];
        setPoints(allPoints);

        const paramPoint = route.params?.point;
        if (paramPoint && (paramPoint.id === 1 || paramPoint.name?.includes('Doña Luz'))) {
            setSelectedPoint(localizedDonaLuz);
            setShowRoute(true);
        } else if (paramPoint) {
            const found = allPoints.find(p => p.id === paramPoint.id);
            setSelectedPoint(found || paramPoint);
            setShowRoute(true);
        } else {
            setSelectedPoint(localizedDonaLuz);
            setShowRoute(true);
        }

        const targetPoint = paramPoint?.id === 1 || !paramPoint ? localizedDonaLuz : (allPoints.find(p => p.id === paramPoint.id) || paramPoint);

        mapRef.current?.animateToRegion({
            latitude: (latitude + targetPoint.latitude) / 2,
            longitude: (longitude + targetPoint.longitude) / 2,
            latitudeDelta: Math.abs(latitude - targetPoint.latitude) * 2.5,
            longitudeDelta: Math.abs(longitude - targetPoint.longitude) * 2.5,
        }, 1000);
    };

    const handleGetDirections = () => {
        if (userLocation && selectedPoint) {
            setShowRoute(true);
            setFallbackPolyline([]);
        }
    };

    const initialRegion = {
        latitude: -16.5000,
        longitude: -68.1200,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header Flotante */}
            <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent']}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ChevronLeft size={28} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Red de Puntos Bolito</Text>
                        <Text style={styles.headerSubtitle}>Viendo tus puntos más cercanos</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Mapa Real */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
                onPress={() => {
                    setSelectedPoint(null);
                    setShowRoute(false);
                }}
            >
                {points.map(point => (
                    <Marker
                        key={point.id}
                        coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                        anchor={{ x: 0.5, y: 0.88 }}
                        onPress={() => {
                            setSelectedPoint(point);
                            setShowRoute(true);
                        }}
                    >
                        <CustomMarker active={selectedPoint?.id === point.id} />
                    </Marker>
                ))}

                {showRoute && userLocation && selectedPoint && (
                    <MapViewDirections
                        origin={userLocation}
                        destination={{ latitude: selectedPoint.latitude, longitude: selectedPoint.longitude }}
                        apikey={GOOGLE_MAPS_APIKEY}
                        strokeWidth={5}
                        strokeColor="#0026e3"
                        mode="WALKING"
                        optimizeWaypoints={true}
                        onError={(errorMessage) => {
                            console.log('Directions Error (Switching to Fallback):', errorMessage);
                            // Si falla la API de Google, trazamos una línea recta como respaldo
                            setFallbackPolyline([
                                userLocation,
                                { latitude: selectedPoint.latitude, longitude: selectedPoint.longitude }
                            ]);

                            // Centrar el mapa manualmente para ver ambos puntos si falla la API
                            mapRef.current?.animateToRegion({
                                latitude: (userLocation.latitude + selectedPoint.latitude) / 2,
                                longitude: (userLocation.longitude + selectedPoint.longitude) / 2,
                                latitudeDelta: Math.abs(userLocation.latitude - selectedPoint.latitude) * 2,
                                longitudeDelta: Math.abs(userLocation.longitude - selectedPoint.longitude) * 2,
                            }, 1000);
                        }}
                        onReady={result => {
                            setFallbackPolyline([]); // Limpiar respaldo si la API funciona
                            setRouteCoordinates(result.coordinates); // Guardar coordenadas para los puentes

                            mapRef.current?.fitToCoordinates([
                                userLocation,
                                { latitude: selectedPoint.latitude, longitude: selectedPoint.longitude },
                                ...result.coordinates
                            ], {
                                edgePadding: {
                                    right: width / 15,
                                    bottom: height / 2.5,
                                    left: width / 15,
                                    top: height / 10,
                                },
                                animated: true,
                            });
                        }}
                    />
                )}

                {/* Puentes Visuales (Estilo Uber) - Solo si la ruta está activa y no es fallback */}
                {showRoute && routeCoordinates.length > 0 && fallbackPolyline.length === 0 && (
                    <>
                        {/* Puente: Usuario -> Inicio de Ruta */}
                        <Polyline
                            coordinates={[userLocation, routeCoordinates[0]]}
                            strokeColor="#0026e3"
                            strokeWidth={5}
                        />
                        {/* Puente: Fin de Ruta -> Punto Destino */}
                        <Polyline
                            coordinates={[routeCoordinates[routeCoordinates.length - 1], { latitude: selectedPoint.latitude, longitude: selectedPoint.longitude }]}
                            strokeColor="#0026e3"
                            strokeWidth={5}
                        />
                    </>
                )}

                {fallbackPolyline.length > 0 && (
                    <Polyline
                        coordinates={fallbackPolyline}
                        strokeColor="#0026e3"
                        strokeWidth={4}
                        lineDashPattern={[5, 5]}
                    />
                )}
            </MapView>

            {/* Card Detalle de Punto Seleccionado */}
            {selectedPoint && (
                <View style={styles.detailCardContainer}>
                    <View style={styles.detailCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.pointInfo}>
                                <Text style={styles.pointName}>{selectedPoint.name}</Text>
                                <Text style={styles.pointAddress}>{selectedPoint.address}</Text>
                            </View>
                            <View style={styles.ratingBadge}>
                                <Star size={14} color="#f59e0b" fill="#f59e0b" />
                                <Text style={styles.ratingText}>{selectedPoint.rating}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.servicesRow}>
                            {selectedPoint.services.map((s: string) => (
                                <View key={s} style={styles.serviceTag}>
                                    <ShieldCheck size={14} color="#0026e3" style={{ marginRight: 6 }} />
                                    <Text style={styles.serviceTagText}>{s}</Text>
                                </View>
                            ))}
                            <Text style={styles.distText}>A {selectedPoint.dist} de ti</Text>
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.directionsBtn}
                                onPress={() => navigation.navigate('PointOperationSetup', { point: selectedPoint })}
                            >
                                <Navigation size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.directionsBtnText}>¿Llegaste? COMENZAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Overlay de Carga */}
            {loadingLocation && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#0026e3" />
                        <Text style={styles.loadingText}>Detectando tu ubicación...</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        zIndex: 10,
        paddingTop: Platform.OS === 'ios' ? 50 : RNStatusBar.currentHeight ? RNStatusBar.currentHeight + 20 : 50,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    markerWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
    },
    markerColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        marginTop: 4,
    },
    creativeMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
            android: { elevation: 4 }
        })
    },
    creativeMarkerActive: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    markerIconInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    markerTip: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#0026e3',
        marginTop: -1,
    },
    markerPulse: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 210, 255, 0.3)',
        zIndex: 0,
    },
    detailCardContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
    },
    detailCard: {
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 15 }
        })
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    pointInfo: {
        flex: 1,
    },
    pointName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    pointAddress: {
        fontSize: 14,
        color: '#64748b',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    ratingText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#92400e',
        marginLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 15,
    },
    servicesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    serviceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginRight: 12,
    },
    serviceTagText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0026e3',
    },
    distText: {
        fontSize: 13,
        color: '#64748b',
        marginLeft: 'auto',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    directionsBtn: {
        flex: 2,
        backgroundColor: '#0026e3',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    directionsBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    operationBtn: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    operationBtnText: {
        color: '#1e293b',
        fontSize: 15,
        fontWeight: 'bold',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingCard: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 8 }
        })
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
    }
});
