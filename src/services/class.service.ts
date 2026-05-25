import api from './api';
import { Class } from '../types';
import { PaginatedResponse } from './classroom.service';

interface GetClassesParams {
    page?: number;
    page_size?: number;
    search?: string;
    major?: string;
    capacity_min?: number;
    capacity_max?: number;
    class_type?: string;
}

export const getClasses = async (params: GetClassesParams = { page: 1 }): Promise<PaginatedResponse<Class>> => {
    try {
        const response = await api.get('/scheduler/classes/', {
            params
        });
        const data = response.data;
        if (Array.isArray(data)) {
            return { count: data.length, next: null, previous: null, results: data };
        }
        return {
            count: data?.count ?? (Array.isArray(data?.results) ? data.results.length : 0),
            next: data?.next ?? null,
            previous: data?.previous ?? null,
            results: Array.isArray(data?.results) ? data.results : [],
        };
    } catch (error) {
        console.error('Error fetching classes:', error);
        throw error;
    }
};

export const createClass = async (data: Omit<Class, 'id'>): Promise<Class> => {
    try {
        const response = await api.post<Class>('/scheduler/classes/', data);
        return response.data;
    } catch (error) {
        console.error('Error creating class:', error);
        throw error;
    }
};

export const updateClass = async (id: string, data: Partial<Class>): Promise<Class> => {
    try {
        const response = await api.put<Class>(`/scheduler/classes/${id}/`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating class ${id}:`, error);
        throw error;
    }
};

export const deleteClass = async (id: string): Promise<void> => {
    try {
        await api.patch(`/scheduler/classes/${id}/`, { is_active: false });
    } catch (error) {
        console.error(`Error deleting class ${id}:`, error);
        throw error;
    }
};
