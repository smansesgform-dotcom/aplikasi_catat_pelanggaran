import { supabase } from './supabaseClient';
import type { Student, Teacher, Violation, ViolationRecord, ReportFilters, EnrichedViolationRecord } from '../types';

// --- Authentication & User Functions ---

export const getTeacherByEmail = async (email: string): Promise<Teacher | null> => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.warn(`Error fetching teacher by email: ${email}`, error.message);
    return null;
  }
  return data;
};

// --- Data Fetching Functions ---

export const searchStudents = async (query: string): Promise<Student[]> => {
  if (!query || query.length < 2) return [];
  const lowerCaseQuery = `%${query.toLowerCase()}%`;
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .or(`name.ilike.${lowerCaseQuery},nipd.ilike.${lowerCaseQuery},nisn.ilike.${lowerCaseQuery}`)
    .limit(10);
    
  if (error) {
    console.error('Error searching students:', error);
    return [];
  }
  return data;
};

export const getTeachers = async (): Promise<Teacher[]> => {
  const { data, error } = await supabase.from('teachers').select('*').order('name');
  if (error) {
    console.error('Error fetching teachers:', error);
    throw new Error('Gagal memuat data guru.');
  }
  return data;
};

export const getViolations = async (): Promise<Violation[]> => {
  const { data, error } = await supabase.from('violations').select('*').order('name');
  if (error) {
    console.error('Error fetching violations:', error);
    throw new Error('Gagal memuat data pelanggaran.');
  }
  return data;
};

export const getClasses = async (): Promise<string[]> => {
    const { data, error } = await supabase.from('students').select('class');
    if (error || !data) {
        console.error('Error fetching classes:', error);
        return [];
    }
    const classes = new Set((data as { class: string }[]).map(s => s.class));
    return Array.from(classes).sort();
};

// --- Violation & Report Logging ---

export const uploadPhoto = async (file: File): Promise<string> => {
  const filePath = `evidence/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  
  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
    throw new Error('Gagal mengunggah foto.');
  }

  const { data } = supabase.storage.from('evidence').getPublicUrl(filePath);
  return data.publicUrl;
};

export const logViolation = async (record: Omit<ViolationRecord, 'id' | 'timestamp'>): Promise<ViolationRecord> => {
  const recordToInsert = {
    ...record,
    timestamp: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('violation_records')
    .insert(recordToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error logging violation:', error);
    throw new Error('Gagal menyimpan catatan pelanggaran.');
  }
  return data;
};

export const getViolationRecords = async (filters: ReportFilters): Promise<EnrichedViolationRecord[]> => {
  let query = supabase.from('violation_records').select('*');

  if (filters.startDate) query = query.gte('timestamp', new Date(filters.startDate).toISOString());
  if (filters.endDate) {
    const endOfDay = new Date(filters.endDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte('timestamp', endOfDay.toISOString());
  }
  if (filters.teacherId) query = query.eq('teacher_id', parseInt(filters.teacherId));
  if (filters.violationId) query = query.contains('violation_ids', [parseInt(filters.violationId)]);

  const { data: records, error: recordsError } = await query;
  
  if (recordsError) {
    console.error('Error fetching violation records:', recordsError);
    throw new Error('Gagal mengambil data laporan.');
  }

  if (!records || records.length === 0) return [];

  // Fetch all related data for client-side enrichment
  const [
    { data: allStudents },
    { data: allTeachers },
    { data: allViolations }
  ] = await Promise.all([
    supabase.from('students').select('*'),
    supabase.from('teachers').select('*'),
    supabase.from('violations').select('*')
  ]);

  const studentMap = new Map<number, Student>(allStudents?.map((s: Student) => [s.id, s]));
  const teacherMap = new Map<number, Teacher>(allTeachers?.map((t: Teacher) => [t.id, t]));
  const violationMap = new Map<number, Violation>(allViolations?.map((v: Violation) => [v.id, v]));

  const enrichedRecords: EnrichedViolationRecord[] = [];
  
  for (const record of records as (ViolationRecord & { id: number })[]) {
      const teacher = teacherMap.get(record.teacher_id);
      if (!teacher) continue;
      
      const recordViolations = record.violation_ids.map((id: number) => violationMap.get(id)).filter(Boolean) as Violation[];
      if (recordViolations.length === 0) continue;

      const violationNames = recordViolations.map(v => v.name).join(', ');
      const totalPoints = recordViolations.reduce((sum, v) => sum + v.points, 0);

      for (const studentId of record.student_ids) {
          const student = studentMap.get(studentId);
          if (!student) continue;

          // Client-side filtering for student and class
          if (filters.studentIds.length > 0 && !filters.studentIds.includes(student.id)) continue;
          if (filters.class && student.class !== filters.class) continue;

          enrichedRecords.push({
              id: record.id,
              timestamp: new Date(record.timestamp).toLocaleString('id-ID'),
              studentName: student.name,
              studentClass: student.class,
              violations: violationNames,
              totalPoints: totalPoints,
              teacherName: teacher.name,
          });
      }
  }

  return enrichedRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// --- Admin Bulk Upload Functions ---

export const uploadStudents = async (data: Omit<Student, 'id'>[]): Promise<{ count: number }> => {
  const { count, error } = await supabase.from('students').insert(data);
  if (error) {
    console.error("Error uploading students:", error);
    throw new Error(`Gagal mengunggah data siswa: ${error.message}`);
  }
  return { count: count ?? 0 };
};

export const uploadTeachers = async (data: Omit<Teacher, 'id'>[]): Promise<{ count: number }> => {
  const { count, error } = await supabase.from('teachers').insert(data);
  if (error) {
    console.error("Error uploading teachers:", error);
    throw new Error(`Gagal mengunggah data guru: ${error.message}`);
  }
  return { count: count ?? 0 };
};

export const uploadViolations = async (data: Omit<Violation, 'id'>[]): Promise<{ count: number }> => {
  const { count, error } = await supabase.from('violations').insert(data);
  if (error) {
    console.error("Error uploading violations:", error);
    throw new Error(`Gagal mengunggah data pelanggaran: ${error.message}`);
  }
  return { count: count ?? 0 };
};

// --- Admin Data Management Functions ---

export const backupTable = async (tableName: 'students' | 'teachers' | 'violations'): Promise<any[]> => {
  const { data, error } = await supabase.from(tableName).select('*').order('id');
  if (error) {
    console.error(`Error backing up ${tableName}:`, error);
    throw new Error(`Gagal membuat backup data ${tableName}.`);
  }
  return data;
};

export const deleteAllFromTable = async (tableName: 'students' | 'teachers' | 'violations'): Promise<{ count: number | null }> => {
  // NOTE: This requires RLS policy to allow DELETE for authenticated users.
  const { count, error } = await supabase.from(tableName).delete().neq('id', -1); // Deletes all rows matching filter
  if (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw new Error(`Gagal menghapus data dari ${tableName}: ${error.message}`);
  }
  return { count };
};

export const restoreTable = async (tableName: 'students' | 'teachers' | 'violations', data: any[]): Promise<{ count: number | null }> => {
  // 1. Delete all existing data
  await deleteAllFromTable(tableName);
  
  // 2. Insert new data (ids and created_at will be auto-generated)
  const dataToInsert = data.map(({ id, created_at, ...rest }) => rest);
  const { count, error } = await supabase.from(tableName).insert(dataToInsert);
  
  if (error) {
    console.error(`Error restoring ${tableName}:`, error);
    throw new Error(`Gagal memulihkan data ke ${tableName}: ${error.message}`);
  }
  return { count };
};