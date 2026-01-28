import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, StyleSheet, Text, Modal, TextInput, Button, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import MapView, { Marker, LongPressEvent, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

interface Place {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    description?: string;
    averageRating?: number;
    reviewCount?: number;
    isFavorite?: boolean;
}

const MapScreen = () => {
    const { userToken } = useContext(AuthContext);
    const [places, setPlaces] = useState<Place[]>([]);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [newCoordinate, setNewCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    const mapRef = useRef<MapView>(null);
    const route = useRoute();


    const [placeName, setPlaceName] = useState('');
    const [placeDesc, setPlaceDesc] = useState('');

    // Review State
    const [rating, setRating] = useState('5');
    const [comment, setComment] = useState('');
    const [shouldFavorite, setShouldFavorite] = useState(false);


    useEffect(() => {
        const params = route.params as any;
        if (params?.latitude && params?.longitude) {
            const { latitude, longitude } = params;

            setTimeout(() => {
                mapRef.current?.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }, 1000);
            }, 500);
        }
    }, [route.params]);


    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {

                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            const params = route.params as any;
            if (!params?.latitude) {
                mapRef.current?.animateToRegion({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }, 1000);
            }
        })();

        fetchPlaces();
    }, []);

    const fetchPlaces = async () => {
        try {
            const response = await api.get('/places');
            setPlaces(response.data);
        } catch (error) {
            console.log('Error fetching places', error);
        }
    };

    useEffect(() => {
        if (selectedPlace) {
            const updated = places.find(p => p.id === selectedPlace.id);
            if (updated) setSelectedPlace(updated);
        }
    }, [places]);

    const handleLongPress = (e: LongPressEvent) => {
        if (!userToken) {
            Alert.alert('Login Required', 'You must be logged in to add a new place.');
            return;
        }
        setNewCoordinate(e.nativeEvent.coordinate);
        setModalVisible(true);
    };

    const handleAddPlace = async () => {
        if (!newCoordinate || !placeName) return;

        try {
            const response = await api.post('/places', {
                name: placeName,
                latitude: newCoordinate.latitude,
                longitude: newCoordinate.longitude,
                description: placeDesc,
            });

            setPlaces([...places, response.data]);

            setModalVisible(false);
            setPlaceName('');
            setPlaceDesc('');
            setNewCoordinate(null);
            Alert.alert('Success', 'Place added and saved to favorites!');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to add place';
            Alert.alert('Error', msg);
        }
    };

    const handleFavorite = async (placeId: string) => {
        if (!userToken) return;
        try {
            await api.post('/places/favorite', { placeId });
            fetchPlaces(); // Refresh to update isFavorite status
        } catch (error) {
            Alert.alert('Error', 'Could not update favorites');
        }
    }

    const openReviewModal = (placeId: string) => {
        if (!userToken) {
            Alert.alert('Login Required', 'You must be logged in to review.');
            return;
        }
        setSelectedPlaceId(placeId);
        setReviewModalVisible(true);
    }

    const handleMarkerPress = (place: Place) => {
        setSelectedPlace(place);
    };

    const handleSubmitReview = async () => {
        if (!selectedPlaceId) return;

        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            Alert.alert('Error', 'Rating must be between 1 and 5');
            return;
        }

        try {
            await api.post('/places/review', {
                placeId: selectedPlaceId,
                rating: ratingNum,
                comment,
                addToFavorites: shouldFavorite
            });
            Alert.alert('Success', 'Review added!');
            setReviewModalVisible(false);
            setRating('5');
            setComment('');
            setShouldFavorite(false);
            fetchPlaces(); // Refresh to show new average and favorite status
        } catch (error) {
            Alert.alert('Error', 'Failed to add review');
        }
    }

    const goToMyLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        }, 1000);
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                onLongPress={handleLongPress}
                onMapReady={() => {
                }}
            >
                {places.map((place) => (
                    <Marker
                        key={place.id}
                        coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                        onPress={() => handleMarkerPress(place)}
                    >
                        <View>
                            <Text style={{ fontSize: 40 }}>
                                {place.isFavorite ? '❤️' : '💩'}
                            </Text>
                        </View>
                        <Callout>
                            <View style={{ padding: 10, minWidth: 100 }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{place.name}</Text>
                                {place.averageRating !== undefined && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <FontAwesome name="star" size={12} color="#FFD700" />
                                        <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: 'bold' }}>
                                            {place.averageRating.toFixed(1)}
                                        </Text>
                                    </View>
                                )}
                                <Text style={{ fontSize: 10, color: '#007AFF', marginTop: 5, fontWeight: 'bold' }}>
                                    Tap for details & rate
                                </Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>


            <TouchableOpacity style={styles.myLocationButton} onPress={goToMyLocation}>
                <MaterialIcons name="my-location" size={24} color="black" />
            </TouchableOpacity>

            {selectedPlace && (
                <View style={styles.detailsCard}>
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{selectedPlace.name}</Text>
                            <Text style={styles.cardDesc}>{selectedPlace.description}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                            <MaterialIcons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardStats}>
                        {selectedPlace.averageRating !== undefined && (
                            <View style={styles.cardRatingRow}>
                                <FontAwesome name="star" size={18} color="#FFD700" />
                                <Text style={styles.cardRatingText}>
                                    {selectedPlace.averageRating.toFixed(1)} ({selectedPlace.reviewCount} reviews)
                                </Text>
                            </View>
                        )}
                    </View>

                    {userToken && (
                        <View style={styles.cardButtons}>
                            <TouchableOpacity
                                style={[styles.mainButton, { backgroundColor: selectedPlace.isFavorite ? '#666' : '#FF6347' }]}
                                onPress={() => handleFavorite(selectedPlace.id)}
                            >
                                <MaterialIcons
                                    name={selectedPlace.isFavorite ? "favorite" : "favorite-border"}
                                    size={20}
                                    color="white"
                                />
                                <Text style={styles.buttonText}>
                                    {selectedPlace.isFavorite ? 'Saved' : 'Save'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.mainButton, { backgroundColor: '#FFA500' }]}
                                onPress={() => openReviewModal(selectedPlace.id)}
                            >
                                <FontAwesome name="star" size={20} color="white" />
                                <Text style={styles.buttonText}>Rate</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.centeredView}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={styles.modalView}
                        >
                            <Text style={styles.modalText}>Add New Restroom</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Name (e.g. Mall Bathroom 2F)"
                                value={placeName}
                                onChangeText={setPlaceName}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Description (Cleanliness, Code, etc.)"
                                value={placeDesc}
                                onChangeText={setPlaceDesc}
                            />

                            <View style={styles.buttonRow}>
                                <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
                                <Button title="Save" onPress={handleAddPlace} />
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={reviewModalVisible}
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.centeredView}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={styles.modalView}
                        >
                            <Text style={styles.modalText}>Rate this Restroom</Text>

                            <Text>Rating (1-5):</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="5"
                                value={rating}
                                onChangeText={setRating}
                                keyboardType="numeric"
                                maxLength={1}
                            />

                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                placeholder="Comment (Optional)"
                                value={comment}
                                onChangeText={setComment}
                                multiline
                            />

                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setShouldFavorite(!shouldFavorite)}
                            >
                                <MaterialIcons
                                    name={shouldFavorite ? "check-box" : "check-box-outline-blank"}
                                    size={24}
                                    color="#FFA500"
                                />
                                <Text style={styles.checkboxText}>Save to my favorites</Text>
                            </TouchableOpacity>

                            <View style={styles.buttonRow}>
                                <Button title="Cancel" color="red" onPress={() => setReviewModalVisible(false)} />
                                <Button title="Submit" onPress={handleSubmitReview} />
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    myLocationButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%'
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold'
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        width: '100%',
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 5
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    calloutContainer: {
        width: 200,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calloutTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 5,
        color: '#333',
    },
    calloutDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    calloutRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        padding: 5,
        borderRadius: 5,
    },
    calloutRatingText: {
        marginLeft: 5,
        fontSize: 13,
        fontWeight: 'bold',
        color: '#444',
    },
    calloutButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    calloutButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 5,
        flex: 0.48,
        alignItems: 'center',
    },
    calloutButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    checkboxText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    detailsCard: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    cardDesc: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    cardStats: {
        marginBottom: 15,
    },
    cardRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardRatingText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
    },
    cardButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    mainButton: {
        flex: 0.48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    }
});

export default MapScreen;
