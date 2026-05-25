import api from '@/services/api';
import { Subject } from '../types';

export interface GetSubjectsParams {
    search?: string;
    min_credits?: number;
    max_credits?: number;
    allow_evening?: boolean;
    session_type?: string;
    page?: number;
    page_size?: number;
}

export interface SubjectsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Subject[];
}

export const subjectService = {
    getSubjects: async (params?: GetSubjectsParams): Promise<SubjectsResponse | Subject[]> => {
        const response = await api.get('/scheduler/subjects/', { params });
        return response.data;
    },

    getSubjectById: async (id: string): Promise<Subject> => {
        const response = await api.get(`/scheduler/subjects/${id}/`);
        return response.data;
    },

    createSubject: async (data: Partial<Subject>): Promise<Subject> => {
        // Reverse mappings from Frontend format back to backend expectations
        const mappedData: any = {
            ...data,
            title: data.name, // Frontend uses 'name', Backend expects 'title'
            can_be_evening: data.allowEvening, // Frontend 'allowEvening' -> Backend 'can_be_evening'
            total_slots: data.totalSessions,
            lecture_slots: data.theorySessions,
            practice_slots: data.practiceSessions,
        };
        const response = await api.post('/scheduler/subjects/', mappedData);
        return response.data;
    },

    updateSubject: async (id: string, data: Partial<Subject>): Promise<Subject> => {
        const mappedData: any = {
            ...data,
            title: data.name,
            can_be_evening: data.allowEvening,
            total_slots: data.totalSessions,
            lecture_slots: data.theorySessions,
            practice_slots: data.practiceSessions,
        };
        const response = await api.patch(`/scheduler/subjects/${id}/`, mappedData);
        return response.data;
    },

    deleteSubject: async (id: string): Promise<void> => {
        await api.delete(`/scheduler/subjects/${id}/`);
    }
};

// Aliases for easier imports, matching other services
export const {
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
} = subjectService;
