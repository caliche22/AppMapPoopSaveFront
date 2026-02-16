import api from './api';

export interface Advertisement {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    latitude: number;
    longitude: number;
    contactName?: string;
    active: boolean;
}

export const getAds = async (): Promise<Advertisement[]> => {
    try {
        const response = await api.get('/ads');
        return response.data;
    } catch (error) {
        console.error('Error fetching ads:', error);
        return [];
    }
};
