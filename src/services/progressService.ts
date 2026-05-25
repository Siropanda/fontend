// src/services/progressService.ts

import api from '@/services/api';

export interface SubjectProgress {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  ltRequired: number;
  thRequired: number;
  ltScheduled: number;
  thScheduled: number;
  ltCompleted: number;
  thCompleted: number;
  ltProgress: number;   // 0–100
  thProgress: number;   // 0–100
  overallProgress: number; // 0–100
}

export const getClassProgress = async (classGroupId: string): Promise<SubjectProgress[]> => {
  const response = await api.get('/scheduler/subjects/progress/', {
    params: { class_group: classGroupId }
  });
  return response.data;
};