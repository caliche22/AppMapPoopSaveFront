import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface AuthContextProps {
    userToken: string | null;
    isLoading: boolean;
    userInfo: any;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
    userToken: null,
    isLoading: false,
    userInfo: null,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<any>(null);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, ...user } = response.data;

            setUserToken(token);
            setUserInfo(user);
            await SecureStore.setItemAsync('token', token);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
        } catch (error) {
            console.log('Login error', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', { name, email, password });
            const { token, ...user } = response.data;

            setUserToken(token);
            setUserInfo(user);
            await SecureStore.setItemAsync('token', token);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));
        } catch (error) {
            console.log('Register error', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('userInfo');
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            const token = await SecureStore.getItemAsync('token');
            const user = await SecureStore.getItemAsync('userInfo');

            if (token && user) {
                setUserToken(token);
                setUserInfo(JSON.parse(user));
            }
        } catch (error) {
            console.log('isLoggedIn error', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, register, logout, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
