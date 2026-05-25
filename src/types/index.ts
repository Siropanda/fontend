export type UserRole = 'admin' | 'teacher';

export type SubjectType = 'theory' | 'practice' | 'exam';

export type RoomType = 'theory' | 'lab' | 'clinical' | 'lecture_hall' | 'exam';

export type CampusLocation = 'Campus 1' | 'Campus 2' | 'Campus 3' | 'Campus 4';

export type AcademicDegree = 'bachelor' | 'master' | 'doctor' | 'associate_professor' | 'professor';

export type ScheduleMode = 'regular' | 'exam' | 'combined';

export type ExamType = 'theory' | 'practice';

export type LessonType = 'theory' | 'practice';

export type TeacherType = 'full-time' | 'visiting';

export type ClassType = 'regular' | 'transfer';

// Alias for backward compatibility
export type ClassroomType = 'theory' | 'practice';

// 1. TEACHER MANAGEMENT
export interface AvailableSlot {
  day: string;
  period: number;
}

export interface Teacher {
  id: string;
  
  // Basic fields
  fullName: string;
  shortName?: string;
  email?: string;
  phone?: string;
  idCardNumber?: string;
  dateOfBirth?: string | null;
  department: string;
  role: 'teacher' | 'admin';
  teacherType: TeacherType;
  
  // 🔥 QUAN TRỌNG: Phải có các field này
  academicDegree: AcademicDegree | null;  // ← Thêm nếu thiếu
  availableSlots: WeeklySlot[];            // ← Thêm nếu thiếu
  subjectIds: string[];                    // ← Thêm nếu thiếu (mapped từ competencies)
  
  // Metadata
  createdAt: string | null;
  updatedAt: string | null;
  isActive: boolean;
}

export interface WeeklySlot {
  day: string;  // 'Monday', 'Tuesday',...
  period: number;
}
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page?: number;
  page_size?: number;
  total_pages?: number;
}
export interface TeacherFilterConfig {
  subjectId?: string;
  department?: string;
  status?: 'all' | 'active' | 'inactive';
  academicDegree?: AcademicDegree | 'all';
  teacherType?: TeacherType | 'all';
}


// 2. SUBJECT MANAGEMENT
export type TeacherPriority = 'high' | 'medium' | 'low';

export interface SubjectTeacherAssignment {
  teacherId: string;
  priority: TeacherPriority;
}


export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  totalSessions: number;
  theorySessions: number;
  practiceSessions: number;
  allowEvening: boolean;
  assignedTeachers?: SubjectTeacherAssignment[];
  // Legacy fields for compatibility
  title?: string;
  type?: SubjectType;
  totalSlots?: number;
  canBeEveningClass?: boolean;
  totalLectureSessions?: number;
  totalPracticeSessions?: number;
  requiredClassroomType?: ClassroomType;
}

// 3. CLASSROOM MANAGEMENT
export interface Classroom {
  id: string;
  code: string;
  name: string;
  type: RoomType;
  capacity: number;
}

// 4. CLASS MANAGEMENT (Student Groups)
export interface Class {
  id: string;
  code: string;
  name: string;
  major: string;
  schoolYear: string;
  studentCount: number;
  classType: ClassType; // Chính quy / Liên thông
  note?: string;
  isExportTKB: boolean;
  // Legacy field
  numberOfStudents?: number;
  notes?: string;
}

// 5. TEACHER-SUBJECT MAPPING
export interface TeacherSubject {
  teacherId: string;
  subjectId: string;
}

// Lightweight nested objects returned by the backend alongside FK ids.
// Using these directly in the UI makes rendering resilient to pagination/filtering
// of the parent lists (Subjects, Teachers, Classrooms) — names never go "N/A"
// because they're attached to the schedule entry itself.
export interface NestedSubject {
  id: string;
  code: string;
  name: string;
}

export interface NestedTeacher {
  id: string;
  fullName: string;
  shortName?: string;
  phone?: string;
  academicDegree?: AcademicDegree | null;
}

export interface NestedClassroom {
  id: string;
  code: string;
  name: string;
}

export interface NestedClass {
  id: string;
  code: string;
  name: string;
}

export interface ScheduleSession {
  id: string;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  classId: string;
  // Nested objects (preferred for rendering — avoids id→name lookups)
  subject?: NestedSubject;
  teacher?: NestedTeacher;
  classroom?: NestedClassroom;
  classGroup?: NestedClass;
  date: string;
  startTime: string;
  endTime: string;
  period: number; // 1-10
  lessonTitle?: string;
  completedSlots: number;
  scheduleMode?: ScheduleMode;
  lessonType?: LessonType;
  examType?: ExamType;
  examStartTime?: string;
  examDuration?: number; // minutes
  isExam?: boolean;
  note?: string;
  // Metadata for direct display (fallbacks for lookups)
  subjectCode?: string;
  subjectTitle?: string;
  subjectName?: string;
  teacherShortName?: string;
  roomCode?: string;
  classCode?: string;
}

export interface ConflictAlert {
  type: 'teacher' | 'room';
  message: string;
  sessions: string[];
}

// 6. AUTHENTICATION
export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User; // Depending on your backend response, sometimes it just returns tokens
}

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
  // Add other user fields as needed based on your 'common.User' model
}
