import api from '@/services/api';
import { ScheduleSession } from '../types';

export interface GetSchedulesParams {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  classroomId?: string;
  start_date?: string;
  end_date?: string;
}

export interface PaginatedScheduleResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ScheduleSession[];
}

// Map backend SlotReadSerializer to frontend ScheduleSession
const mapBackendToFrontend = (data: any): ScheduleSession => ({
  id: String(data.id),
  subjectId: data.subject?.id ? String(data.subject.id) : (data.subject ? String(data.subject) : ''),
  teacherId: data.teacher?.id ? String(data.teacher.id) : (data.teacher ? String(data.teacher) : ''),
  classId: data.class_group?.id ? String(data.class_group.id) : (data.class_group ? String(data.class_group) : ''),
  classroomId: data.classroom?.id ? String(data.classroom.id) : (data.classroom ? String(data.classroom) : ''),
  date: data.date,
  startTime: data.start_time?.substring(0, 5) || '',
  endTime: data.end_time?.substring(0, 5) || '',
  period: data.start_period || 1,
  lessonTitle: data.lesson_title || '',
  completedSlots: data.completed_slots || 0,
  // Extract metadata if objects are nested
  subjectCode: data.subject?.code,
  subjectName: data.subject?.name,
  teacherShortName: data.teacher?.short_name,
  roomCode: data.classroom?.code,
  classCode: data.class_group?.code,
});

// Map frontend ScheduleSession to backend SlotWriteSerializer
const mapFrontendToBackend = (data: Partial<ScheduleSession>): any => {
  const payload: any = {};
  if (data.subjectId !== undefined) payload.subject = data.subjectId || null;
  if (data.teacherId !== undefined) payload.teacher = data.teacherId || null;
  if (data.classId !== undefined) payload.class_group = data.classId;
  if (data.classroomId !== undefined) payload.classroom = data.classroomId || null;
  if (data.date !== undefined) payload.date = data.date;
  
  if (data.startTime !== undefined) {
      payload.start_time = data.startTime.length === 5 ? `${data.startTime}:00` : data.startTime;
  }
  if (data.endTime !== undefined) {
      payload.end_time = data.endTime.length === 5 ? `${data.endTime}:00` : data.endTime;
  }
  
  if (data.period !== undefined) {
      payload.start_period = data.period;
      payload.end_period = data.period; // Assuming 1 period blocks for simple mapping
  }
  if (data.lessonTitle !== undefined) payload.lesson_title = data.lessonTitle;
  if (data.lessonType !== undefined) payload.lesson_type = data.lessonType;
  
  // Set default schedule_type
  if (!payload.schedule_type) {
      payload.schedule_type = 'lesson';
  }
  return payload;
};

export const getSchedules = async (params?: GetSchedulesParams): Promise<PaginatedScheduleResponse> => {
  // Convert camelCase params to snake_case for DRF if needed
  const queryParams: any = {};
  if (params?.classId) queryParams.class_group = params.classId;
  if (params?.subjectId) queryParams.subject = params.subjectId;
  if (params?.teacherId) queryParams.teacher = params.teacherId;
  if (params?.classroomId) queryParams.classroom = params.classroomId;
  if (params?.start_date) queryParams.start_date = params.start_date;
  if (params?.end_date) queryParams.end_date = params.end_date;

  // We are removing pagination on getSchedules for now to let Timetable display the whole board
  // If the backend has pagination heavily enforced, we might need to loop pages or increase page_size
  queryParams.page_size = 1000;

  const response = await api.get('/scheduler/slots/', { params: queryParams });
  const data = response.data;
  const rawResults = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  return {
    count: Array.isArray(data) ? data.length : (data?.count ?? rawResults.length),
    next: Array.isArray(data) ? null : (data?.next ?? null),
    previous: Array.isArray(data) ? null : (data?.previous ?? null),
    results: rawResults.map(mapBackendToFrontend),
  };
};

export const createSchedule = async (data: Partial<ScheduleSession>): Promise<ScheduleSession> => {
  const payload = mapFrontendToBackend(data);
  const response = await api.post('/scheduler/slots/', payload);
  return mapBackendToFrontend(response.data);
};

export const updateSchedule = async (id: string, data: Partial<ScheduleSession>): Promise<ScheduleSession> => {
  const payload = mapFrontendToBackend(data);
  const response = await api.patch(`/scheduler/slots/${id}/`, payload);
  return mapBackendToFrontend(response.data);
};

export const deleteSchedule = async (id: string): Promise<void> => {
  await api.delete(`/scheduler/slots/${id}/`);
};
