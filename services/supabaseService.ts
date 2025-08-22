import { supabase } from './supabaseClient';
import type { Student, Teacher, Violation, ViolationRecord, ReportFilters, EnrichedViolationRecord } from '../types';

// --- Helper Functions ---

/**
 * Menerjemahkan error teknis dari Supabase menjadi pesan yang mudah dipahami.
 * @param error Error object from Supabase.
 * @returns A user-friendly error string.
 */
const parseSupabaseUploadError = (error: any): string => {
  const message = error.message || '';
  if (message.includes('duplicate key value violates unique constraint')) {
    if (message.includes('students_nipd_key')) return `NIPD duplikat.`;
    if (message.includes('students_nisn_key')) return `NISN duplikat.`;
    if (message.includes('teachers_email_key')) return `Email guru duplikat.`;
    if (message.includes('teachers_nip_key')) return `NIP guru duplikat.`;
    if (message.includes('violations_name_key')) return `Nama pelanggaran duplikat.`;
    return 'Ditemukan data duplikat.';
  }
  if (message.includes('violates not-null constraint')) {
    const columnMatch = message.match(/column "(\w+)"/);
    if (columnMatch) {
      return `Kolom '${columnMatch[1]}' tidak boleh kosong.`;
    }
    return 'Salah satu kolom wajib tidak diisi.';
  }
  if (message.includes('check constraint')) {
      if (message.includes('students_gender_check')) return "Kolom 'gender' hanya boleh diisi 'L' atau 'P'.";
      if (message.includes('violations_points_check')) return "Kolom 'points' harus lebih besar dari 0.";
  }
  return 'Terjadi kesalahan tidak dikenal. Periksa format data.';
};


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

// --- Admin Bulk Upload Functions (Chunking with Fallback) ---

interface UploadResult {
  successCount: number;
  failures: { row: number, name: string, reason: string }[];
}

/**
 * Generic function to upload data in chunks with a row-by-row fallback for failed chunks.
 * @param tableName - The name of the table to insert into.
 * @param data - The array of data to upload.
 * @param nameField - The field to use for the 'name' in failure reports.
 */
const chunkedUpload = async <T extends { [key: string]: any }>(
  tableName: 'students' | 'teachers' | 'violations',
  data: T[],
  nameField: keyof T
): Promise<UploadResult> => {
  const result: UploadResult = { successCount: 0, failures: [] };
  const CHUNK_SIZE = 250; // A balance between speed and avoiding timeouts

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    // Fast path: try to insert the whole chunk
    const { error: chunkError } = await supabase.from(tableName).insert(chunk);
    
    if (chunkError) {
      // Slow path (fallback): if the chunk fails, process it row-by-row
      console.warn(`Chunk failed, falling back to row-by-row for chunk starting at index ${i}. Error: ${chunkError.message}`);
      for (let j = 0; j < chunk.length; j++) {
        const rowData = chunk[j];
        const originalIndex = i + j;
        const { error: rowError } = await supabase.from(tableName).insert(rowData);
        
        if (rowError) {
          result.failures.push({ 
            row: originalIndex + 2, // +2 to account for header and 0-based index
            name: rowData[nameField]?.toString() || 'N/A', 
            reason: parseSupabaseUploadError(rowError) 
          });
        } else {
          result.successCount++;
        }
      }
    } else {
      // If chunk succeeds, all rows are successful
      result.successCount += chunk.length;
    }
  }
  
  return result;
};


export const uploadStudents = (data: Omit<Student, 'id'>[]): Promise<UploadResult> => {
  return chunkedUpload('students', data, 'name');
};

export const uploadTeachers = (data: Omit<Teacher, 'id'>[]): Promise<UploadResult> => {
  return chunkedUpload('teachers', data, 'name');
};

export const uploadViolations = (data: Omit<Violation, 'id'>[]): Promise<UploadResult> => {
  return chunkedUpload('violations', data, 'name');
};


// --- Admin Data Management Functions ---

export const backupTable = async (tableName: 'students' | 'teachers' | 'violations'): Promise<any[]> => {
  const allData: any[] = [];
  const CHUNK_SIZE = 1000;
  let offset = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('id')
      .range(offset, offset + CHUNK_SIZE - 1);

    if (error) {
      console.error(`Error backing up ${tableName}:`, error);
      throw new Error(`Gagal membuat backup data ${tableName}.`);
    }

    if (data && data.length > 0) {
      allData.push(...data);
      offset += CHUNK_SIZE;
    } else {
      break; 
    }
  }
  return allData;
};

export const deleteAllFromTables = async (tableNames: ('students' | 'teachers' | 'violations' | 'violation_records')[]): Promise<void> => {
  const { error } = await supabase.rpc('truncate_tables', { table_names: tableNames });
  if (error) {
    console.error(`Error deleting from tables:`, error);
    throw new Error(`Gagal menghapus data: ${error.message}`);
  }
};

export const restoreData = async (tableName: 'students' | 'teachers' | 'violations', data: any[]): Promise<{ count: number }> => {
  // 1. Delete all existing data using the robust RPC function
  await deleteAllFromTables([tableName]);
  
  // 2. Insert new data in chunks to respect the 1000-row limit
  const CHUNK_SIZE = 1000;
  const dataToInsert = data.map(({ id, created_at, ...rest }) => rest);
  let totalCount = 0;

  for (let i = 0; i < dataToInsert.length; i += CHUNK_SIZE) {
    const chunk = dataToInsert.slice(i, i + CHUNK_SIZE);
    const { error, count } = await supabase.from(tableName).insert(chunk);
    
    if (error) {
      console.error(`Error restoring chunk to ${tableName}:`, error);
      throw new Error(`Gagal memulihkan data ke ${tableName} pada baris ${i + 1}: ${error.message}. Data mungkin tidak lengkap.`);
    }
    totalCount += count ?? 0;
  }
  return { count: totalCount };
};