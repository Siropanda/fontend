import api from './api';
import { LoginCredentials, AuthResponse, User } from '../types';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/common/login/', credentials);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get<User>('/common/me/');
    return response.data;
};
