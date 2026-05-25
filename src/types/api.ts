export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ClassItem {
  id: number;
  name: string;
}

export interface SubjectItem {
  id: number;
  name: string;
}

export interface ClassroomItem {
  id: number;
  room_number: string;
}

export interface TeacherItem {
  id: number;
  full_name: string;
}
