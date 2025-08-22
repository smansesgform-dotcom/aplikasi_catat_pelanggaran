export interface Student {
  id: number;
  nipd: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  class: string;
}

export interface Teacher {
  id: number;
  name: string;
  nip: string;
  email: string;
}

export interface Violation {
  id: number;
  name: string;
  points: number;
}

export interface ViolationRecord {
  id?: number;
  student_ids: number[];
  violation_ids: number[];
  teacher_id: number;
  timestamp: string;
  photo_urls?: string[];
}

export interface AuthUser {
  name: string;
  email?: string;
  isAdmin: boolean;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  class: string;
  studentIds: number[];
  violationId: string;
  teacherId: string;
}

export interface EnrichedViolationRecord {
  id: number;
  timestamp: string;
  studentName: string;
  studentClass: string;
  violations: string;
  totalPoints: number;
  teacherName: string;
}

export interface StudentSummary {
  studentName: string;
  studentClass: string;
  incidentCount: number;
  totalPoints: number;
}

export interface AllDataBackup {
  students: Student[];
  teachers: Teacher[];
  violations: Violation[];
}
