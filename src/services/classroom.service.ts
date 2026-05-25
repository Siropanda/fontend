import api from './api';
import { Classroom } from '../types';

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const getClassrooms = async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Classroom>> => {
    try {
        const response = await api.get('/scheduler/classrooms/', {
            params: { page, page_size: pageSize }
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
        console.error('Error fetching classrooms:', error);
        throw error;
    }
};

export const createClassroom = async (data: Omit<Classroom, 'id'>): Promise<Classroom> => {
    try {
        const response = await api.post<Classroom>('/scheduler/classrooms/', data);
        return response.data;
    } catch (error) {
        console.error('Error creating classroom:', error);
        throw error;
    }
};

export const updateClassroom = async (id: string, data: Partial<Classroom>): Promise<Classroom> => {
    try {
        const response = await api.put<Classroom>(`/scheduler/classrooms/${id}/`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating classroom ${id}:`, error);
        throw error;
    }
};
export const deleteClassroom = async (id: string): Promise<void> => {
    try {
        await api.patch(`/scheduler/classrooms/${id}/`, { is_active: false });
    } catch (error) {
        console.error(`Error deleting classroom ${id}:`, error);
        throw error;
    }
};
