import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { ScheduleSession } from '../types';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, GetSchedulesParams } from '../services/schedule.service';
import { useAuth } from './AuthContext';

interface ScheduleContextType {
    schedules: ScheduleSession[];
    loading: boolean;
    error: string | null;
    refreshSchedules: (filters?: GetSchedulesParams) => Promise<void>;
    addSchedule: (data: Partial<ScheduleSession>) => Promise<void>;
    editSchedule: (id: string, data: Partial<ScheduleSession>) => Promise<void>;
    removeSchedule: (id: string) => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [schedules, setSchedules] = useState<ScheduleSession[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();

    // Track the latest request to prevent stale responses from overwriting fresh data
    const latestRequestId = useRef(0);

    const fetchSchedules = useCallback(async (filters?: GetSchedulesParams) => {
        const requestId = ++latestRequestId.current;
        setLoading(true);
        setError(null);
        try {
            const data = await getSchedules(filters);
            // Discard if a newer request has been issued in the meantime
            if (requestId !== latestRequestId.current) return;
            const results = Array.isArray(data?.results)
                ? data.results
                : (Array.isArray(data) ? (data as unknown as ScheduleSession[]) : []);
            setSchedules(results);
        } catch (err) {
            if (requestId !== latestRequestId.current) return;
            console.error('Failed to fetch schedules from API:', err);
            setError('Failed to fetch from API.');
            setSchedules([]);
        } finally {
            if (requestId === latestRequestId.current) {
                setLoading(false);
            }
        }
    }, []);

    const addSchedule = async (data: Partial<ScheduleSession>) => {
        try {
            const newSchedule = await createSchedule(data);
            setSchedules(prev => [...prev, newSchedule]);
        } catch (err) {
            console.error('Error adding schedule:', err);
            throw err;
        }
    };

    const editSchedule = async (id: string, data: Partial<ScheduleSession>) => {
        try {
            const updated = await updateSchedule(id, data);
            setSchedules(prev => prev.map(s => s.id === id ? updated : s));
        } catch (err) {
            console.error(`Error updating schedule ${id}:`, err);
            throw err;
        }
    };

    const removeSchedule = async (id: string) => {
        try {
            await deleteSchedule(id);
            setSchedules(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error(`Error deleting schedule ${id}:`, err);
            throw err;
        }
    };

    // Initial load
    useEffect(() => {
        if (isAuthenticated) {
            fetchSchedules();
        }
    }, [fetchSchedules, isAuthenticated]);

    return (
        <ScheduleContext.Provider value={{
            schedules,
            loading,
            error,
            refreshSchedules: fetchSchedules,
            addSchedule,
            editSchedule,
            removeSchedule
        }}>
            {children}
        </ScheduleContext.Provider>
    );
};

export const useSchedules = (): ScheduleContextType => {
    const context = useContext(ScheduleContext);
    if (!context) {
        throw new Error('useSchedules must be used within a ScheduleProvider');
    }
    return context;
};
