import React, { useState, useEffect, useCallback } from 'react';
import type { Student, Teacher, Violation } from '../types';
import { getTeachers, getViolations, logViolation } from '../services/supabaseService';
import StudentSelector from '../components/StudentSelector';
import ViolationSelector from '../components/ViolationSelector';

const ViolationLogger: React.FC = () => {
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedViolations, setSelectedViolations] = useState<Violation[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      const [teachersData, violationsData] = await Promise.all([getTeachers(), getViolations()]);
      setTeachers(teachersData);
      setViolations(violationsData);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setStatusMessage({ type: 'error', message: 'Gagal memuat data guru dan pelanggaran.' });
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const resetForm = () => {
    setSelectedStudents([]);
    setSelectedTeacherId('');
    setSelectedViolations([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0 || selectedViolations.length === 0 || !selectedTeacherId) {
      setStatusMessage({ type: 'error', message: 'Harap lengkapi semua data: siswa, pelanggaran, dan guru pelapor.' });
      return;
    }
    
    setIsLoading(true);
    setStatusMessage(null);

    try {
      await logViolation({
        student_ids: selectedStudents.map(s => s.id),
        violation_ids: selectedViolations.map(v => v.id),
        teacher_id: parseInt(selectedTeacherId, 10),
      });
      setStatusMessage({ type: 'success', message: `${selectedViolations.length} pelanggaran untuk ${selectedStudents.length} siswa berhasil dicatat.` });
      resetForm();
    } catch (error) {
      console.error('Failed to log violation:', error);
      setStatusMessage({ type: 'error', message: 'Terjadi kesalahan saat mencatat pelanggaran.' });
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = selectedStudents.length === 0 || selectedViolations.length === 0 || !selectedTeacherId || isLoading;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Form Pencatatan Pelanggaran</h2>
        
        {statusMessage && (
          <div className={`p-4 mb-4 text-sm rounded-lg ${
            statusMessage.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`} role="alert">
            {statusMessage.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <StudentSelector selectedStudents={selectedStudents} onSelectedStudentsChange={setSelectedStudents} />

          <ViolationSelector
            allViolations={violations}
            selectedViolations={selectedViolations}
            onSelectedViolationsChange={setSelectedViolations}
          />

          <div>
            <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Guru Pelapor
            </label>
            <select
              id="teacher"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="" disabled>Pilih guru</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViolationLogger;