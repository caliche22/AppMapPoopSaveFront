import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your computer's local IP for Android Emulator / Physical Device
// e.g., http://192.168.1.5:3000/api
// For iOS Simulator, http://localhost:3000/api often works
const API_URL = 'http://localhost:3000/api'; 

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
