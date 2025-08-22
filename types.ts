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
}

export interface AuthUser {
  name: string;
  email?: string;
  isAdmin: boolean;
}
