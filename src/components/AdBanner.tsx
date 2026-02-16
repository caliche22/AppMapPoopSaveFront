import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Advertisement } from '../services/adService';

interface AdBannerProps {
    ad: Advertisement;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

const AdBanner: React.FC<AdBannerProps> = ({ ad, onClose }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
            <View style={styles.content}>
                <Image source={{ uri: ad.imageUrl }} style={styles.image} resizeMode="cover" />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{ad.title}</Text>
                    <Text style={styles.description} numberOfLines={2}>{ad.description}</Text>
                    {ad.contactName && <Text style={styles.contact}>Sponsored by: {ad.contactName}</Text>}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Validated to be above tab bar usually
        left: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        padding: 10,
        zIndex: 1000,
    },
    closeButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 1,
        backgroundColor: '#eee',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: '#f0f0f0',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    description: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    contact: {
        fontSize: 10,
        color: '#999',
        fontStyle: 'italic',
    },
});

export default AdBanner;
