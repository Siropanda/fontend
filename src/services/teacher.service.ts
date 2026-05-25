// src/services/teacher.service.ts
import api from './api';
import { Teacher, TeacherType, AcademicDegree, PaginatedResponse } from '../types';

// ===== Types =====
export interface GetTeachersParams {
    page?: number;
    page_size?: number;
    search?: string;
    department?: string;
    teacher_type?: TeacherType | 'all';
    academic_degree?: AcademicDegree | 'all';
    role?: 'teacher' | 'admin' | 'all';
    subject_id?: string;
    ordering?: string;
}

// ===== Constants =====
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const mapToFrontend = (data: any): Teacher => {
    if (!data) return null as any;
    const rawSlots = data.availableSlots || data.available_slots || [];
    const mappedSlots = Array.isArray(rawSlots) 
        ? rawSlots.map((slot: any) => {
            // Convert day: number → string, hoặc chuẩn hóa string nếu đã là string
            let dayStr: string;
            if (typeof slot.day === 'number') {
                // 0 → "Monday", 1 → "Tuesday", ...
                dayStr = DAY_NAMES[slot.day] || 'Monday';
            } else if (typeof slot.day === 'string') {
                // Chuẩn hóa: "monday" → "Monday", "TUESDAY" → "Tuesday"
                const normalized = slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase();
                dayStr = DAY_NAMES.includes(normalized) ? normalized : 'Monday';
            } else {
                dayStr = 'Monday'; // Fallback
            }
            
            return {
                day: dayStr,
                period: typeof slot.period === 'number' ? slot.period : 0,
            };
        })
        : [];
    
    // 🔥 FIX: SubjectIds - Handle nhiều nguồn data với priority rõ ràng
    const mappedSubjectIds = (() => {
        // Ưu tiên 1: subjectIds đã được backend map sẵn (từ to_representation)
        if (Array.isArray(data.subjectIds)) {
            return data.subjectIds
                .filter((id: any) => id?.toString().trim())
                .map((id: any) => id.toString().trim());
        }
        // Ưu tiên 2: subject_ids (snake_case fallback)
        if (Array.isArray(data.subject_ids)) {
            return data.subject_ids
                .filter((id: any) => id?.toString().trim())
                .map((id: any) => id.toString().trim());
        }
        // Ưu tiên 3: competencies - có thể là array of objects hoặc array of IDs
        if (Array.isArray(data.competencies)) {
            return data.competencies
                .map((item: any) => {
                    // Nếu là object: lấy item.id, nếu là string/number: trả về chính nó
                    return typeof item === 'object' && item !== null && item.id 
                        ? item.id 
                        : item;
                })
                .filter((id: any) => id?.toString().trim())
                .map((id: any) => id.toString().trim());
        }
        // Fallback: competencies_ids (write-only field, ít khi có trong response)
        if (Array.isArray(data.competencies_ids)) {
            return data.competencies_ids
                .filter((id: any) => id?.toString().trim())
                .map((id: any) => id.toString().trim());
        }
        return [];
    })();
    
    return {
        // ===== ID & Metadata =====
        id: data.id,
        createdAt: data.createdAt || data.created_at || null,
        updatedAt: data.updatedAt || data.updated_at || null,
        isActive: data.isActive ?? data.is_active ?? true,
        
        // ===== Basic Fields - Ưu tiên camelCase từ serializer, fallback snake_case =====
        fullName: data.fullName || data.full_name || '',
        shortName: data.shortName || data.short_code || '',
        email: data.email || data.user_email || data.user?.email || '',
        phone: data.phone || '',
        idCardNumber: data.idCardNumber || data.id_card_number || '',
        dateOfBirth: data.dateOfBirth || data.date_of_birth || null,
        department: data.department || '',
        role: data.role || 'teacher',
        teacherType: data.teacherType || data.teacher_type || 'full-time',
        
        // 🔥 academicDegree: fallback về null nếu không có giá trị
        academicDegree: data.academicDegree || data.academic_degree || null,
        
        // 🔥 Available Slots - đã được map ở trên
        availableSlots: mappedSlots,
        
        // 🔥 SubjectIds - đã được map ở trên
        subjectIds: mappedSubjectIds,
    };
};

const mapToBackend = (data: Partial<Teacher>): any => {
    const mapped: any = {};
    
    // Basic fields: empty string → null (Django compatibility)
    if (data.fullName !== undefined) mapped.full_name = data.fullName?.trim() || null;
    if (data.shortName !== undefined) mapped.short_code = data.shortName?.trim() || null;
    

    if (data.phone !== undefined) {
    const phoneVal = data.phone?.trim();
    if (phoneVal) mapped.phone = phoneVal;
}
if (data.idCardNumber !== undefined) {
    const idVal = data.idCardNumber?.trim();
    if (idVal) mapped.id_card_number = idVal;
}
      if (data.email !== undefined) {
        const emailVal = data.email?.trim()?.toLowerCase();
        if (emailVal) mapped.email = emailVal; // Required for creation
    }
    if (data.dateOfBirth !== undefined) {
        mapped.date_of_birth = data.dateOfBirth || null;
    }
    if (data.department !== undefined) {
        const deptVal = data.department?.trim();
        if (deptVal) mapped.department = deptVal;
    }
    // Enum fields
    if (data.role !== undefined) mapped.role = data.role;
    if (data.teacherType !== undefined) mapped.teacher_type = data.teacherType;
    if (data.academicDegree !== undefined) mapped.academic_degree = data.academicDegree || null;
    if (data.isActive !== undefined) mapped.is_active = data.isActive;
    
    // Available slots: convert day string → number
    if (Array.isArray(data.availableSlots)) {
        mapped.available_slots = data.availableSlots
            .filter(slot => slot?.day && typeof slot.period === 'number')
            .map(slot => ({
                day: typeof slot.day === 'string' 
                    ? Math.max(0, DAY_NAMES.indexOf(slot.day)) 
                    : slot.day,
                period: slot.period,
            }));
    }
    
    // Subjects: subjectIds → competencies_ids (write-only field name)
    if (Array.isArray(data.subjectIds)) {
        const validIds = data.subjectIds
            .filter((id: any) => id?.toString().trim())
            .map((id: any) => id.toString().trim());
        if (validIds.length > 0) {
            mapped.competencies_ids = validIds;
        }
    }

    
    return mapped;
};
export const getTeachers = async (
    params: GetTeachersParams = { page: 1 }
): Promise<PaginatedResponse<Teacher>> => {
    try {
        // Clean params: remove 'all', empty, undefined values
        const cleanParams: Record<string, any> = {};
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && value !== 'all') {
                cleanParams[key] = value;
            }
        });
        
        // Ensure numeric params
        if (cleanParams.page) cleanParams.page = parseInt(String(cleanParams.page), 10) || 1;
        if (cleanParams.page_size) cleanParams.page_size = parseInt(String(cleanParams.page_size), 10) || 10;
        
        const response = await api.get<PaginatedResponse<any>>('/scheduler/teachers/', {
            params: cleanParams,
        });
        
        return {
            ...response.data,
            results: (response.data.results || [])
                .map(mapToFrontend)
                .filter((t: Teacher | null): t is Teacher => t !== null),
        };
    } catch (error: any) {
        console.error('[TeacherService] getTeachers error:', error);
        throw error;
    }
};

export const createTeacher = async (data: Omit<Teacher, 'id'>): Promise<Teacher> => {
    try {
        const payload = mapToBackend(data);
        console.log('📤 Sending to backend:', data);
        const response = await api.post<any>('/scheduler/teachers/', payload)
         console.log('📥 Raw response from backend:', response.data); 
        const result = mapToFrontend(response.data);
         console.log('🔄 Mapped to frontend:', result);
        if (!result) throw new Error('Invalid response from createTeacher');
        return result;
    } catch (error: any) {
        console.error('[TeacherService] createTeacher error:', error);
        // Helpful debug for 400 errors
        if (error.response?.status === 400) {
            console.warn('Validation errors:', error.response.data);
        }
        throw error;
    }
};

export const updateTeacher = async (id: string, data: Partial<Teacher>): Promise<Teacher> => {
    try {
        const payload = mapToBackend(data); // ← Map frontend → backend
         console.log('📤 Sending to backend:', data);
        const response = await api.patch<any>(`/scheduler/teachers/${id}/`, payload);
         console.log('📥 Raw response from backend:', response.data); 

        const result = mapToFrontend(response.data); // ← Map backend → frontend
         console.log('🔄 Mapped to frontend:', result);

        if (!result) throw new Error('Invalid response from updateTeacher');
        return result;
    } catch (error) {
        console.error(`Error updating teacher ${id}:`, error);
        throw error;
    }
};

export const deleteTeacher = async (id: string): Promise<void> => {
    try {
        // Soft delete: PATCH { is_active: false }
        await api.patch(`/scheduler/teachers/${id}/`, { is_active: false });
    } catch (error: any) {
        console.error(`[TeacherService] deleteTeacher(${id}) error:`, error);
        throw error;
    }
};

export const restoreTeacher = async (id: string): Promise<Teacher> => {
    try {
        const response = await api.patch<any>(`/scheduler/teachers/${id}/`, { is_active: true });
        const result = mapToFrontend(response.data);
        if (!result) throw new Error('Invalid response from restoreTeacher');
        return result;
    } catch (error: any) {
        console.error(`[TeacherService] restoreTeacher(${id}) error:`, error);
        throw error;
    }
};
