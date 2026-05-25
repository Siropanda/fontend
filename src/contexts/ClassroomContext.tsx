import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Classroom } from '../types';
import { getClassrooms, createClassroom, updateClassroom, deleteClassroom, PaginatedResponse } from '../services/classroom.service';
import { useAuth } from './AuthContext';

interface ClassroomContextType {
    classrooms: Classroom[];
    allClassrooms: Classroom[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    refreshClassrooms: (page?: number) => Promise<void>;
    fetchAllClassrooms: () => Promise<void>;
    addClassroom: (data: Omit<Classroom, 'id'>) => Promise<void>;
    updateClassroom: (id: string, data: Partial<Classroom>) => Promise<void>;
    removeClassroom: (id: string) => Promise<void>;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export const ClassroomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(10);
    const { isAuthenticated } = useAuth();

    const fetchClassrooms = useCallback(async (page: number = currentPage) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getClassrooms(page, 1000);
            setClassrooms(data.results);
            setAllClassrooms(prev => {
                const newMap = new Map(prev.map(c => [c.id, c]));
                data.results.forEach((c: Classroom) => newMap.set(c.id, c));
                return Array.from(newMap.values());
            });
            setTotalCount(data.count);
            setTotalPages(Math.ceil(data.count / pageSize) || 1);
            setCurrentPage(page);
        } catch (err) {
            console.error('Failed to fetch classrooms from API:', err);
            setError('Failed to fetch from API.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    const fetchAllClassrooms = useCallback(async () => {
        try {
            let allData: Classroom[] = [];
            let nextPage: number | null = 1;
            
            while (nextPage !== null) {
                const data = await getClassrooms(nextPage, 1000);
                allData = [...allData, ...data.results];
                
                if (data.next) {
                    const url = new URL(data.next, window.location.origin);
                    const nextVal = url.searchParams.get('page');
                    nextPage = nextVal ? parseInt(nextVal) : null;
                } else {
                    nextPage = null;
                }
            }
            setAllClassrooms(allData);
        } catch (err) {
            console.error('Failed to fetch all classrooms:', err);
        }
    }, []);

    const addClassroom = async (data: Omit<Classroom, 'id'>) => {
        await createClassroom(data);
        await fetchClassrooms(currentPage);
        await fetchAllClassrooms();
    };

    const editClassroom = async (id: string, data: Partial<Classroom>) => {
        const updated = await updateClassroom(id, data);
        setClassrooms(prev => prev.map(c => c.id === id ? updated : c));
        setAllClassrooms(prev => prev.map(c => c.id === id ? updated : c));
    };

    const handleSetPageSize = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const removeClassroomAction = async (id: string) => {
        try {
            // we assume deleteClassroom is imported
            await deleteClassroom(id);
            setClassrooms(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error(`Error removing classroom ${id}:`, err);
            throw err;
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchClassrooms(1);
            fetchAllClassrooms();
        }
    }, [pageSize, isAuthenticated]);

    return (
        <ClassroomContext.Provider value={{
            classrooms,
            allClassrooms,
            loading,
            error,
            currentPage,
            totalPages,
            totalCount,
            pageSize,
            setPage: (page: number) => fetchClassrooms(page),
            setPageSize: handleSetPageSize,
            refreshClassrooms: fetchClassrooms,
            fetchAllClassrooms,
            addClassroom,
            updateClassroom: editClassroom,
            removeClassroom: removeClassroomAction
        }}>
            {children}
        </ClassroomContext.Provider>
    );
};

export const useClassrooms = (): ClassroomContextType => {
    const context = useContext(ClassroomContext);
    if (context === undefined) {
        throw new Error('useClassrooms must be used within a ClassroomProvider');
    }
    return context;
};
