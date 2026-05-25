import { Teacher, Subject, Classroom, Class, ScheduleSession, AcademicDegree } from '@/types';

// Helper to format teacher display name with degree
export const getDegreePrefix = (degree?: AcademicDegree): string => {
  switch (degree) {
    case 'professor': return 'Prof.';
    case 'associate_professor': return 'Assoc. Prof.';
    case 'doctor': return 'Dr.';
    case 'master': return '';
    case 'bachelor': return '';
    default: return '';
  }
};

export const getDegreeSuffix = (degree?: AcademicDegree): string => {
  switch (degree) {
    case 'master': return ', M.Sc.';
    case 'bachelor': return ', B.Sc.';
    default: return '';
  }
};

export const formatTeacherName = (name: string, degree?: AcademicDegree): string => {
  const prefix = getDegreePrefix(degree);
  const suffix = getDegreeSuffix(degree);
  return prefix ? `${prefix} ${name}${suffix}` : `${name}${suffix}`;
};

export const ACADEMIC_DEGREES = [
  { value: '', label: 'None', labelVi: 'Không' },
  { value: 'ba', label: 'Bachelor', labelVi: 'Cử nhân' },
  { value: 'master', label: 'Master', labelVi: 'Thạc sĩ' },
  { value: 'phd', label: 'PhD', labelVi: 'Tiến sĩ' },
  { value: 'assoc-prof', label: 'Assoc. Prof.', labelVi: 'PGS' },
  { value: 'professor', label: 'Professor', labelVi: 'GS' },
];


export interface TeacherAvailability {
  teacherId: string;
  date: string;
  timeSlot: string;
  isAvailable: boolean;
}

export const mockTeachers: Teacher[] = [
  {
    id: '1',
    fullName: 'Dr. Sarah Johnson',
    shortName: 'Dr. Johnson',
    email: 'sarah.j@university.edu',
    phone: '0901234567',
    idCardNumber: '012345678901',
    dateOfBirth: '1985-03-15',
    department: 'Computer Science',
    role: 'teacher',
    teacherType: 'full-time',
    availableSlots: [
      { day: 'Mon', period: 1 }, { day: 'Mon', period: 2 }, { day: 'Mon', period: 3 },
      { day: 'Tue', period: 1 }, { day: 'Tue', period: 2 },
      { day: 'Wed', period: 3 }, { day: 'Wed', period: 4 },
      { day: 'Thu', period: 1 }, { day: 'Thu', period: 3 },
      { day: 'Fri', period: 2 },
    ],
    subjectIds: ['1', '2'],
    academicDegree: 'doctor',
    createdAt: null,
    updatedAt: null,
    isActive: true,
  },
  {
    id: '2',
    fullName: 'Prof. Michael Chen',
    shortName: 'Prof. Chen',
    email: 'michael.c@university.edu',
    phone: '0909876543',
    idCardNumber: '012345678902',
    dateOfBirth: '1978-07-22',
    department: 'Mathematics',
    role: 'teacher',
    teacherType: 'full-time',
    availableSlots: [
      { day: 'Mon', period: 1 }, { day: 'Mon', period: 2 },
      { day: 'Wed', period: 1 },
      { day: 'Thu', period: 1 }, { day: 'Thu', period: 4 },
      { day: 'Sat', period: 2 },
      { day: 'Sun', period: 2 },
    ],
    subjectIds: ['3'],
    academicDegree: 'professor',
    createdAt: null,
    updatedAt: null,
    isActive: true,
  },
  {
    id: '3',
    fullName: 'Dr. Emily Rodriguez',
    shortName: 'Dr. Rodriguez',
    email: 'emily.r@university.edu',
    phone: '0905551234',
    idCardNumber: '012345678903',
    dateOfBirth: '1990-11-08',
    department: 'Physics',
    role: 'teacher',
    teacherType: 'visiting',
    availableSlots: [
      { day: 'Mon', period: 3 },
      { day: 'Tue', period: 3 }, { day: 'Tue', period: 4 },
      { day: 'Wed', period: 1 }, { day: 'Wed', period: 2 },
      { day: 'Thu', period: 2 },
      { day: 'Fri', period: 1 }, { day: 'Fri', period: 3 },
      { day: 'Sat', period: 1 }, { day: 'Sat', period: 2 },
      { day: 'Sun', period: 1 }, { day: 'Sun', period: 3 },
    ],
    subjectIds: ['1', '2'],
    academicDegree: 'doctor',
    createdAt: null,
    updatedAt: null,
    isActive: true,
  },
  {
    id: '4',
    fullName: 'Admin User',
    shortName: 'Admin',
    email: 'admin@university.edu',
    phone: '0901111111',
    idCardNumber: '012345678904',
    dateOfBirth: '1992-05-20',
    department: 'Administration',
    role: 'admin',
    teacherType: 'full-time',
    availableSlots: [],
    subjectIds: [],
    academicDegree: null,
    createdAt: null,
    updatedAt: null,
    isActive: true,
  },
];

export const mockSubjects: Subject[] = [
  {
    id: '1',
    code: 'CS101',
    name: 'Introduction to Programming',
    credits: 3,
    totalSessions: 15,
    theorySessions: 10,
    practiceSessions: 5,
    allowEvening: true,
  },
  {
    id: '2',
    code: 'CS102',
    name: 'Programming Lab',
    credits: 2,
    totalSessions: 10,
    theorySessions: 0,
    practiceSessions: 10,
    allowEvening: false,
  },
  {
    id: '3',
    code: 'MATH201',
    name: 'Calculus II',
    credits: 4,
    totalSessions: 20,
    theorySessions: 15,
    practiceSessions: 5,
    allowEvening: true,
  },
  {
    id: '4',
    code: 'PHY101',
    name: 'Physics I',
    credits: 3,
    totalSessions: 15,
    theorySessions: 10,
    practiceSessions: 5,
    allowEvening: false,
  },
];

export const mockClassrooms: Classroom[] = [
  { id: '1', code: 'A101', name: 'Lecture Hall A', capacity: 60, type: 'theory' },
  { id: '2', code: 'A102', name: 'Lecture Hall B', capacity: 50, type: 'theory' },
  { id: '3', code: 'B201', name: 'Computer Lab 1', capacity: 30, type: 'lab' },
  { id: '4', code: 'B202', name: 'Computer Lab 2', capacity: 25, type: 'lab' },
  { id: '5', code: 'C301', name: 'Seminar Room', capacity: 40, type: 'theory' },
];

export const mockClasses: Class[] = [
  {
    id: '1',
    code: 'CS-A',
    name: 'Computer Science - Section A',
    major: 'Computer Science',
    schoolYear: '2024-2025',
    studentCount: 35,
    classType: 'regular',
    note: 'Morning section',
    isExportTKB: true
  },
  {
    id: '2',
    code: 'CS-B',
    name: 'Computer Science - Section B',
    major: 'Computer Science',
    schoolYear: '2024-2025',
    studentCount: 32,
    classType: 'regular',
    note: 'Afternoon section',
    isExportTKB: true
  },
  {
    id: '3',
    code: 'MATH-1',
    name: 'Mathematics - Group 1',
    major: 'Mathematics',
    schoolYear: '2024-2025',
    studentCount: 40,
    classType: 'transfer',
    isExportTKB: true
  },
  {
    id: '4',
    code: 'PHY-A',
    name: 'Physics - Section A',
    major: 'Physics',
    schoolYear: '2024-2025',
    studentCount: 28,
    classType: 'regular',
    isExportTKB: false
  },
];

export const mockSchedules: ScheduleSession[] = [
  // Monday - CS-A
  { id: '1', subjectId: '1', teacherId: '1', classroomId: '1', classId: '1', date: '2025-01-13', startTime: '07:00', endTime: '09:00', period: 1, lessonTitle: 'Variables and Data Types', completedSlots: 5 },
  { id: '2', subjectId: '3', teacherId: '2', classroomId: '2', classId: '1', date: '2025-01-13', startTime: '09:00', endTime: '11:00', period: 2, lessonTitle: 'Derivatives', completedSlots: 8 },
  { id: '3', subjectId: '2', teacherId: '1', classroomId: '3', classId: '1', date: '2025-01-13', startTime: '13:00', endTime: '15:00', period: 3, lessonTitle: 'Loops Practice', completedSlots: 3 },

  // Tuesday - CS-A
  { id: '4', subjectId: '3', teacherId: '2', classroomId: '1', classId: '1', date: '2025-01-14', startTime: '07:00', endTime: '09:00', period: 1, lessonTitle: 'Integration Techniques', completedSlots: 9 },
  { id: '5', subjectId: '1', teacherId: '1', classroomId: '5', classId: '1', date: '2025-01-14', startTime: '09:00', endTime: '11:00', period: 2, lessonTitle: 'Functions and Methods', completedSlots: 6 },

  // Wednesday - CS-A
  { id: '6', subjectId: '2', teacherId: '1', classroomId: '3', classId: '1', date: '2025-01-15', startTime: '13:00', endTime: '15:00', period: 3, lessonTitle: 'Arrays and Lists', completedSlots: 4 },
  { id: '7', subjectId: '1', teacherId: '1', classroomId: '2', classId: '1', date: '2025-01-15', startTime: '15:00', endTime: '17:00', period: 4, lessonTitle: 'Object-Oriented Basics', completedSlots: 7 },

  // Thursday - CS-A
  { id: '8', subjectId: '3', teacherId: '2', classroomId: '1', classId: '1', date: '2025-01-16', startTime: '07:00', endTime: '09:00', period: 1, lessonTitle: 'Series and Sequences', completedSlots: 10 },
  { id: '9', subjectId: '2', teacherId: '1', classroomId: '4', classId: '1', date: '2025-01-16', startTime: '13:00', endTime: '15:00', period: 3, lessonTitle: 'File I/O Practice', completedSlots: 5 },

  // Friday - CS-A
  { id: '10', subjectId: '1', teacherId: '1', classroomId: '5', classId: '1', date: '2025-01-17', startTime: '09:00', endTime: '11:00', period: 2, lessonTitle: 'Review Session', completedSlots: 8 },

  // Monday - CS-B
  { id: '11', subjectId: '3', teacherId: '2', classroomId: '2', classId: '2', date: '2025-01-13', startTime: '07:00', endTime: '09:00', period: 1, lessonTitle: 'Limits and Continuity', completedSlots: 7 },
  { id: '12', subjectId: '1', teacherId: '3', classroomId: '5', classId: '2', date: '2025-01-13', startTime: '13:00', endTime: '15:00', period: 3, lessonTitle: 'Intro to Programming', completedSlots: 4 },

  // Tuesday - CS-B
  { id: '13', subjectId: '2', teacherId: '3', classroomId: '3', classId: '2', date: '2025-01-14', startTime: '13:00', endTime: '15:00', period: 3, lessonTitle: 'Basic Syntax Practice', completedSlots: 2 },
  { id: '14', subjectId: '1', teacherId: '3', classroomId: '1', classId: '2', date: '2025-01-14', startTime: '15:00', endTime: '17:00', period: 4, lessonTitle: 'Control Structures', completedSlots: 5 },

  // Wednesday - CS-B
  { id: '15', subjectId: '3', teacherId: '2', classroomId: '2', classId: '2', date: '2025-01-15', startTime: '07:00', endTime: '09:00', period: 1, lessonTitle: 'Differentiation Rules', completedSlots: 8 },
  { id: '16', subjectId: '2', teacherId: '3', classroomId: '4', classId: '2', date: '2025-01-15', startTime: '09:00', endTime: '11:00', period: 2, lessonTitle: 'Debugging Exercises', completedSlots: 3 },

  // Thursday - CS-B
  { id: '17', subjectId: '1', teacherId: '3', classroomId: '5', classId: '2', date: '2025-01-16', startTime: '09:00', endTime: '11:00', period: 2, lessonTitle: 'Data Structures', completedSlots: 6 },
  { id: '18', subjectId: '3', teacherId: '2', classroomId: '1', classId: '2', date: '2025-01-16', startTime: '15:00', endTime: '17:00', period: 4, lessonTitle: 'Applications of Derivatives', completedSlots: 9 },

  // Friday - CS-B
  { id: '19', subjectId: '2', teacherId: '3', classroomId: '3', classId: '2', date: '2025-01-17', startTime: '07:00', endTime: '09:00', period: 1, lessonTitle: 'Algorithm Practice', completedSlots: 4 },
  { id: '20', subjectId: '1', teacherId: '3', classroomId: '2', classId: '2', date: '2025-01-17', startTime: '13:00', endTime: '15:00', period: 3, lessonTitle: 'Final Project Planning', completedSlots: 7 },

  // Saturday - CS-A
  { id: '21', subjectId: '2', teacherId: '1', classroomId: '3', classId: '1', date: '2025-01-18', startTime: '07:00', endTime: '09:00', period: 1, lessonTitle: 'Weekend Lab Session', completedSlots: 6 },
  { id: '22', subjectId: '3', teacherId: '2', classroomId: '1', classId: '1', date: '2025-01-18', startTime: '09:00', endTime: '11:00', period: 2, lessonTitle: 'Calculus Review', completedSlots: 11 },

  // Saturday - CS-B
  { id: '23', subjectId: '1', teacherId: '3', classroomId: '5', classId: '2', date: '2025-01-18', startTime: '07:00', endTime: '09:00', period: 1, lessonTitle: 'Catch-up Session', completedSlots: 5 },
  { id: '24', subjectId: '2', teacherId: '3', classroomId: '4', classId: '2', date: '2025-01-18', startTime: '09:00', endTime: '11:00', period: 2, lessonTitle: 'Extra Practice', completedSlots: 4 },

  // Sunday - CS-A
  { id: '25', subjectId: '1', teacherId: '1', classroomId: '2', classId: '1', date: '2025-01-19', startTime: '09:00', endTime: '11:00', period: 2, lessonTitle: 'Office Hours', completedSlots: 9 },

  // Sunday - CS-B
  { id: '26', subjectId: '3', teacherId: '2', classroomId: '1', classId: '2', date: '2025-01-19', startTime: '09:00', endTime: '11:00', period: 2, lessonTitle: 'Math Tutoring', completedSlots: 10 },
  { id: '27', subjectId: '1', teacherId: '3', classroomId: '5', classId: '2', date: '2025-01-19', startTime: '13:00', endTime: '15:00', period: 3, lessonTitle: 'Project Work', completedSlots: 6 },
];
