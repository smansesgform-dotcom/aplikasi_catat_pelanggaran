
import type { Student, Teacher, Violation, ViolationRecord } from '../types';

// Mock data to simulate a database
let mockStudents: Student[] = [
  { id: 1, nipd: '12345', nisn: '54321', name: 'Budi Santoso', gender: 'L', class: 'XII IPA 1' },
  { id: 2, nipd: '12346', nisn: '54322', name: 'Citra Lestari', gender: 'P', class: 'XII IPA 1' },
  { id: 3, nipd: '12347', nisn: '54323', name: 'Dewi Anggraini', gender: 'P', class: 'XII IPS 2' },
  { id: 4, nipd: '12348', nisn: '54324', name: 'Eko Prasetyo', gender: 'L', class: 'XI IPA 3' },
  { id: 5, nipd: '12349', nisn: '54325', name: 'Fajar Nugroho', gender: 'L', class: 'XI IPS 1' },
];

let mockTeachers: Teacher[] = [
  { id: 1, name: 'Dr. Ahmad Fauzi', nip: '198001012005011001', email: 'ahmad.fauzi@sekolah.id' },
  { id: 2, name: 'Siti Nurhaliza, S.Pd.', nip: '198502022008012002', email: 'siti.nurhaliza@sekolah.id' },
  { id: 3, name: 'Prof. Dr. Bambang Susilo', nip: '197503032000011003', email: 'bambang.susilo@sekolah.id' },
];

let mockViolations: Violation[] = [
  { id: 1, name: 'Terlambat masuk sekolah', points: 5 },
  { id: 2, name: 'Tidak mengerjakan PR', points: 10 },
  { id: 3, name: 'Seragam tidak lengkap', points: 5 },
  { id: 4, name: 'Merokok di area sekolah', points: 50 },
  { id: 5, name: 'Berkelahi', points: 75 },
];

let mockViolationRecords: ViolationRecord[] = [];
let nextViolationRecordId = 1;

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getTeacherByEmail = async (email: string): Promise<Teacher | undefined> => {
  await delay(100);
  return mockTeachers.find(teacher => teacher.email.toLowerCase() === email.toLowerCase());
};

export const searchStudents = async (query: string): Promise<Student[]> => {
  await delay(300);
  if (!query) return [];
  const lowerCaseQuery = query.toLowerCase();
  return mockStudents.filter(
    student =>
      student.name.toLowerCase().includes(lowerCaseQuery) ||
      student.nipd.includes(lowerCaseQuery) ||
      student.nisn.includes(lowerCaseQuery)
  );
};

export const getTeachers = async (): Promise<Teacher[]> => {
  await delay(200);
  return [...mockTeachers];
};

export const getViolations = async (): Promise<Violation[]> => {
  await delay(200);
  return [...mockViolations];
};

export const logViolation = async (record: Omit<ViolationRecord, 'id' | 'timestamp'>): Promise<ViolationRecord> => {
  await delay(500);
  const newRecord: ViolationRecord = {
    ...record,
    id: nextViolationRecordId++,
    timestamp: new Date().toISOString(),
  };
  mockViolationRecords.push(newRecord);
  console.log('New Violation Logged:', newRecord);
  console.log('All Records:', mockViolationRecords);
  return newRecord;
};

export const uploadStudents = async (data: Omit<Student, 'id'>[]): Promise<{ count: number }> => {
    await delay(1000);
    let currentMaxId = mockStudents.length > 0 ? Math.max(...mockStudents.map(s => s.id)) : 0;
    const newStudents = data.map((s, index) => ({...s, id: currentMaxId + index + 1}));
    mockStudents = [...mockStudents, ...newStudents];
    console.log('Uploaded Students:', newStudents);
    return { count: newStudents.length };
};

export const uploadTeachers = async (data: Omit<Teacher, 'id'>[]): Promise<{ count: number }> => {
    await delay(1000);
    let currentMaxId = mockTeachers.length > 0 ? Math.max(...mockTeachers.map(t => t.id)) : 0;
    const newTeachers = data.map((t, index) => ({...t, id: currentMaxId + index + 1}));
    mockTeachers = [...mockTeachers, ...newTeachers];
    console.log('Uploaded Teachers:', newTeachers);
    return { count: newTeachers.length };
};

export const uploadViolations = async (data: Omit<Violation, 'id'>[]): Promise<{ count: number }> => {
    await delay(1000);
    let currentMaxId = mockViolations.length > 0 ? Math.max(...mockViolations.map(v => v.id)) : 0;
    const newViolations = data.map((v, index) => ({...v, id: currentMaxId + index + 1}));
    mockViolations = [...mockViolations, ...newViolations];
    console.log('Uploaded Violations:', newViolations);
    return { count: newViolations.length };
};
