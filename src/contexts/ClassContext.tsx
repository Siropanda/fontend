import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Class } from '../types';
import { getClasses, createClass, updateClass, deleteClass } from '../services/class.service';
import { useAuth } from './AuthContext';

interface ClassContextType {
    classes: Class[];
    allClasses: Class[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    setPage: (page: number) => void;
    refreshClasses: (filters?: any) => Promise<void>;
    fetchAllClasses: () => Promise<void>;
    addClass: (data: Omit<Class, 'id'>) => Promise<void>;
    editClass: (id: string, data: Partial<Class>) => Promise<void>;
    removeClass: (id: string) => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [allClasses, setAllClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);

    const [filters, setFilters] = useState<any>({});
    const { isAuthenticated } = useAuth();

    const fetchClasses = React.useCallback(async (page: number = currentPage, currentFilters: any = filters) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getClasses({ page, page_size: 1000, ...currentFilters });
            setClasses(data.results);
            setAllClasses(prev => {
                const newMap = new Map(prev.map(c => [c.id, c]));
                data.results.forEach((c: Class) => newMap.set(c.id, c));
                return Array.from(newMap.values());
            });
            setTotalCount(data.count);
            const pageSize = 10; // Assuming 10 is default
            setTotalPages(Math.ceil(data.count / pageSize) || 1);
            setCurrentPage(page);
            setFilters(currentFilters);
        } catch (err) {
            console.error('Failed to fetch classes from API:', err);
            setError('Failed to fetch from API.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters]);

    const fetchAllClasses = React.useCallback(async () => {
        try {
            let allData: Class[] = [];
            let nextPage: number | null = 1;
            
            while (nextPage !== null) {
                const data = await getClasses({ page: nextPage, page_size: 1000 });
                allData = [...allData, ...data.results];
                
                if (data.next) {
                    const url = new URL(data.next, window.location.origin);
                    const nextVal = url.searchParams.get('page');
                    nextPage = nextVal ? parseInt(nextVal) : null;
                } else {
                    nextPage = null;
                }
            }
            setAllClasses(allData);
        } catch (err) {
            console.error('Failed to fetch all classes:', err);
        }
    }, []);

    const addClass = async (data: Omit<Class, 'id'>) => {
        try {
            const newClass = await createClass(data);
            setClasses(prev => [...prev, newClass]);
            setAllClasses(prev => [...prev, newClass]);
        } catch (err) {
            console.error('Error adding class:', err);
            throw err;
        }
    };

    const editClass = async (id: string, data: Partial<Class>) => {
        try {
            const updated = await updateClass(id, data);
            setClasses(prev => prev.map(c => c.id === id ? updated : c));
            setAllClasses(prev => prev.map(c => c.id === id ? updated : c));
        } catch (err) {
            console.error(`Error updating class ${id}:`, err);
            throw err;
        }
    };

    const removeClass = async (id: string) => {
        try {
            await deleteClass(id);
            setClasses(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error(`Error deleting class ${id}:`, err);
            throw err;
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchClasses();
            fetchAllClasses();
        }
    }, [isAuthenticated]);

    return (
        <ClassContext.Provider value={{
            classes,
            allClasses,
            loading,
            error,
            currentPage,
            totalPages,
            totalCount,
            setPage: (p: number) => {
                fetchClasses(p, filters);
            },
            refreshClasses: (newFilters?: any) => fetchClasses(1, newFilters || {}),
            fetchAllClasses,
            addClass,
            editClass,
            removeClass
        }}>
            {children}
        </ClassContext.Provider>
    );
};

export const useClasses = (): ClassContextType => {
    const context = useContext(ClassContext);
    if (context === undefined) {
        throw new Error('useClasses must be used within a ClassProvider');
    }
    return context;
};
