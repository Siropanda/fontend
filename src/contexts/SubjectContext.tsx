import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Subject } from '../types';
import { subjectService, GetSubjectsParams } from '../services/subject.service';
import { useAuth } from './AuthContext';

interface SubjectContextType {
    subjects: Subject[];
    allSubjects: Subject[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    setPage: (page: number) => void;
    fetchSubjects: (page?: number, filters?: GetSubjectsParams) => Promise<void>;
    fetchAllSubjects: () => Promise<void>;
    refreshSubjects: (filters?: GetSubjectsParams) => Promise<void>;
    addSubject: (subject: Partial<Subject>) => Promise<void>;
    editSubject: (id: string, subject: Partial<Subject>) => Promise<void>;
    removeSubject: (id: string) => Promise<void>;
}

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export const SubjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [currentFilters, setCurrentFilters] = useState<GetSubjectsParams>({});
    const { isAuthenticated } = useAuth();

    const fetchSubjects = useCallback(async (page: number = 1, filters?: GetSubjectsParams) => {
        setLoading(true);
        setError(null);
        try {
            const activeFilters = filters || currentFilters;
            if (filters) setCurrentFilters(filters);

            const response = await subjectService.getSubjects({ ...activeFilters, page, page_size: 1000 });

            if ('results' in response) {
                setSubjects(response.results);
                // Merge into allSubjects for lookups
                setAllSubjects(prev => {
                    const newMap = new Map(prev.map(s => [s.id, s]));
                    response.results.forEach((s: Subject) => newMap.set(s.id, s));
                    return Array.from(newMap.values());
                });
                setTotalCount(response.count);
                setTotalPages(Math.ceil(response.count / 10)); // Assuming 10 per page
            } else {
                setSubjects(response);
                setAllSubjects(response);
                setTotalCount(response.length);
                setTotalPages(1);
            }
            setCurrentPage(page);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch subjects');
            console.error('Error fetching subjects:', err);
        } finally {
            setLoading(false);
        }
    }, [currentFilters]);

    const fetchAllSubjects = useCallback(async () => {
        try {
            let allData: Subject[] = [];
            let nextParams: GetSubjectsParams = { page_size: 1000 };
            let hasNext = true;

            while (hasNext) {
                const response = await subjectService.getSubjects(nextParams);
                
                if ('results' in response) {
                    allData = [...allData, ...response.results];
                    if (response.next) {
                        const url = new URL(response.next, window.location.origin);
                        const nextPage = url.searchParams.get('page');
                        if (nextPage) {
                            nextParams.page = parseInt(nextPage);
                        } else {
                            hasNext = false;
                        }
                    } else {
                        hasNext = false;
                    }
                } else {
                    allData = response;
                    hasNext = false;
                }
            }

            setAllSubjects(prev => {
                const newMap = new Map(prev.map(s => [s.id, s]));
                allData.forEach((s: Subject) => newMap.set(s.id, s));
                return Array.from(newMap.values());
            });
        } catch (err) {
            console.error('Error fetching all subjects:', err);
        }
    }, []);

    const addSubject = async (subject: Partial<Subject>) => {
        try {
            const newSubject = await subjectService.createSubject(subject);
            setSubjects(prev => [newSubject, ...prev]);
            setAllSubjects(prev => [newSubject, ...prev]);
        } catch (err) {
            console.error('Error adding subject:', err);
            throw err;
        }
    };

    const editSubject = async (id: string, subject: Partial<Subject>) => {
        try {
            const updatedSubject = await subjectService.updateSubject(id, subject);
            setSubjects(prev => prev.map(s => s.id === id ? updatedSubject : s));
            setAllSubjects(prev => prev.map(s => s.id === id ? updatedSubject : s));
        } catch (err) {
            console.error(`Error updating subject ${id}:`, err);
            throw err;
        }
    };

    const removeSubject = async (id: string) => {
        try {
            await subjectService.deleteSubject(id);
            setSubjects(prev => prev.filter(s => s.id !== id));
            setAllSubjects(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error(`Error deleting subject ${id}:`, err);
            throw err;
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchSubjects();
            fetchAllSubjects();
        }
    }, [isAuthenticated]);

    return (
        <SubjectContext.Provider value={{
            subjects,
            allSubjects,
            loading,
            error,
            currentPage,
            totalPages,
            totalCount,
            setPage: (p: number) => {
                fetchSubjects(p, currentFilters);
            },
            fetchSubjects,
            fetchAllSubjects,
            refreshSubjects: (newFilters?: GetSubjectsParams) => fetchSubjects(1, newFilters || {}),
            addSubject,
            editSubject,
            removeSubject
        }}>
            {children}
        </SubjectContext.Provider>
    );
};

export const useSubjects = (): SubjectContextType => {
    const context = useContext(SubjectContext);
    if (context === undefined) {
        throw new Error('useSubjects must be used within a SubjectProvider');
    }
    return context;
};
