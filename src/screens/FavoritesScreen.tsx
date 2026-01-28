import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, TextInput, Button, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';

interface Favorite {
    id: string;
    place: {
        id: string;
        name: string;
        description: string;
        latitude: number;
        longitude: number;
        averageRating?: number;
        reviewCount?: number;
    }
}

const FavoritesScreen = () => {
    const { userToken } = useContext(AuthContext);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    // Review State
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [rating, setRating] = useState('5');
    const [comment, setComment] = useState('');

    const fetchFavorites = async () => {
        if (!userToken) return;
        setLoading(true);
        try {
            const response = await api.get('/places/favorites');
            setFavorites(response.data);
        } catch (error) {
            console.log('Error fetching favorites', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchFavorites();
        }, [userToken])
    );

    const handlePress = (place: Favorite['place']) => {
        (navigation as any).navigate('Map', {
            latitude: place.latitude,
            longitude: place.longitude
        });
    }

    const openReviewModal = (placeId: string) => {
        setSelectedPlaceId(placeId);
        setReviewModalVisible(true);
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
                comment
            });
            Alert.alert('Success', 'Review added!');
            setReviewModalVisible(false);
            setRating('5');
            setComment('');
            fetchFavorites(); // Refresh the list to see updated average
        } catch (error) {
            Alert.alert('Error', 'Failed to add review');
        }
    };

    if (!userToken) {
        return (
            <View style={styles.center}>
                <Text>Please login to see favorites.</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handlePress(item.place)}>
                        <View style={styles.card}>
                            <View style={styles.header}>
                                <Text style={styles.title}>{item.place.name} 💩</Text>
                                {item.place.averageRating !== undefined && (
                                    <View style={styles.ratingRow}>
                                        <FontAwesome name="star" size={14} color="#FFD700" />
                                        <Text style={styles.ratingText}>
                                            {item.place.averageRating.toFixed(1)} ({item.place.reviewCount})
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.description}>{item.place.description}</Text>
                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={styles.rateButton}
                                    onPress={() => openReviewModal(item.place.id)}
                                >
                                    <Text style={styles.rateButtonText}>Rate This POOP 💩</Text>
                                </TouchableOpacity>
                                <Text style={styles.hint}>Tap to view on map</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No favorites yet.</Text>}
            />

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
        padding: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#444',
    },
    description: {
        color: '#666',
        marginBottom: 5,
    },
    hint: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    rateButton: {
        backgroundColor: '#FFA500',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    rateButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    }
});

export default FavoritesScreen;
