// src/contexts/TeacherContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Teacher, TeacherType, AcademicDegree } from '../types';
import { 
    getTeachers, 
    createTeacher, 
    updateTeacher, 
    deleteTeacher,
    restoreTeacher
} from '../services/teacher.service';
import { restoreTeacher as restoreTeacherAPI, updateTeacher as updateTeacherAPI } from '../services/teacher.service'; // ✅ Import với alias để tránh trùng tên
import { useToast } from '../contexts/ToastContext';
import { displayApiError } from '../utils/apiErrorHandler';
import { useAuth } from './AuthContext';
interface TeacherContextType {
    teachers: Teacher[];
    allTeachers: Teacher[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    refreshTeachers: (filters?: any) => Promise<void>;
    fetchAllTeachers: () => Promise<void>;
    addTeacher: (data: Omit<Teacher, 'id'>) => Promise<Teacher>;
    updateTeacher: (id: string, data: Partial<Teacher>) => Promise<Teacher>;
    removeTeacher: (id: string) => Promise<void>;
    restoreTeacher: (id: string) => Promise<Teacher>;
}

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

export const TeacherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [pageSize, setPageSizeState] = useState<number>(10);

    const [filters, setFilters] = useState<any>({});
    const { isAuthenticated } = useAuth();

    const fetchTeachers = React.useCallback(async (page: number = currentPage, currentFilters: any = filters) => {
        setLoading(true);
        setError(null);
        try {
            // Build params object matching GetTeachersParams
            const params: any = { page, page_size: 1000, ...currentFilters };
            
            // Map frontend filter names to backend API params
            if (params.teacherType) {
                params.teacher_type = params.teacherType;
                delete params.teacherType;
            }
            if (params.academicDegree) {
                params.academic_degree = params.academicDegree;
                delete params.academicDegree;
            }
            if (params.subjectId) {
                params.subject_id = params.subjectId;
                delete params.subjectId;
            }
            // Note: 'role', 'department', 'search' already match backend
            
            const data = await getTeachers(params);
            
            
            setTeachers(data.results);
            setAllTeachers(prev => {
                const newMap = new Map(prev.map(t => [t.id, t]));
                data.results.forEach((t: Teacher) => newMap.set(t.id, t));
                return Array.from(newMap.values());
            });
            setTotalCount(data.count);
            setTotalPages(Math.ceil(data.count / pageSize) || 1);
            setCurrentPage(page);
            setFilters(currentFilters);
            
        } catch (err: any) {
            console.error('Failed to fetch teachers from API:', err);
            const errorMessage = err.response?.data?.detail 
                || err.response?.data?.message 
                || 'Failed to fetch teachers';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters, pageSize]);

    const fetchAllTeachers = React.useCallback(async () => {
        try {
            let allData: Teacher[] = [];
            let nextParams: any = { page_size: 1000 };
            let hasNext = true;

            while (hasNext) {
                const data = await getTeachers(nextParams);
                allData = [...allData, ...data.results];
                
                if (data.next) {
                    // Extract page number from next URL
                    const url = new URL(data.next, window.location.origin);
                    const nextPage = url.searchParams.get('page');
                    if (nextPage) {
                        nextParams.page = parseInt(nextPage);
                    } else {
                        hasNext = false;
                    }
                } else {
                    hasNext = false;
                }
            }
            setAllTeachers(allData);
        } catch (err) {
            console.error('Failed to fetch all teachers:', err);
        }
    }, []);

    const addTeacher = async (data: Omit<Teacher, 'id'>): Promise<Teacher> => {
        try {
            const newTeacher = await createTeacher(data);
            setTeachers(prev => [newTeacher, ...prev]);
            setAllTeachers(prev => [newTeacher, ...prev]);
            setTotalCount(prev => prev + 1);
            await fetchTeachers();
            toast.success('Thêm giáo viên thành công!', 'Giáo viên đã được tạo.');  // ✅
            return newTeacher;
        } catch (err: any) {
           displayApiError(err, toast.error);
            throw err;  // ✅
            throw err;
        }
    };

    const handleUpdateTeacher = async (id: string, data: Partial<Teacher>): Promise<Teacher> => {
        try {
            const updated = await updateTeacherAPI(id, data);
            setTeachers(prev => prev.map(t => t.id === id ? updated : t));
            setAllTeachers(prev => prev.map(t => t.id === id ? updated : t));
            await fetchTeachers();
            toast.success('Cập nhật thành công!', 'Thông tin giáo viên đã được cập nhật.');  // ✅
            return updated;
        } catch (err: any) {
            displayApiError(err, toast.error);  // ✅
            throw err;
        }
    };

    const removeTeacher = async (id: string): Promise<void> => {
        try {
            await deleteTeacher(id);
            setTeachers(prev => prev.filter(t => t.id !== id));
            setTotalCount(prev => Math.max(0, prev - 1));
            await fetchTeachers();
            toast.warning('Đã vô hiệu hóa giáo viên', 'Giáo viên đã được chuyển vào danh sách ẩn.');  // ✅
        } catch (err: any) {
            displayApiError(err, toast.error);  // ✅
            throw err;
        }
    };

    const restoreTeacher = async (id: string): Promise<Teacher> => {
        try {
            const restored = await restoreTeacherAPI(id);
            setTeachers(prev => [restored, ...prev]);
            setTotalCount(prev => prev + 1);
            await fetchTeachers();
            toast.success('Khôi phục thành công!', 'Giáo viên đã được kích hoạt lại.');  // ✅
            return restored;
        } catch (err: any) {
            displayApiError(err, toast.error);  // ✅
            throw err;
        }
    };

    // Initial load
    useEffect(() => {
        if (isAuthenticated) {
            fetchTeachers();
            fetchAllTeachers();
        }
    }, [isAuthenticated]);

    return (
        <TeacherContext.Provider value={{
            teachers,
            allTeachers,
            loading,
            error,
            currentPage,
            totalPages,
            totalCount,
            pageSize,
            setPage: (p: number) => {
                fetchTeachers(p, filters);
            },
            setPageSize: (size: number) => {
                setPageSizeState(size);
                fetchTeachers(1, filters);
            },
            refreshTeachers: (newFilters?: any) => fetchTeachers(1, newFilters || {}),
            fetchAllTeachers,
            addTeacher,
            updateTeacher: handleUpdateTeacher,
            removeTeacher,
            restoreTeacher,
        }}>
            {children}
        </TeacherContext.Provider>
    );
};

export const useTeachers = (): TeacherContextType => {
    const context = useContext(TeacherContext);
    if (context === undefined) {
        throw new Error('useTeachers must be used within a TeacherProvider');
    }
    return context;
};
