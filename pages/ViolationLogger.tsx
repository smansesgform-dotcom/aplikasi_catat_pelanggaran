import React, { useState, useEffect, useCallback } from 'react';
import type { Student, Teacher, Violation } from '../types';
import { getTeachers, getViolations, logViolation, uploadPhoto } from '../services/supabaseService';
import StudentSelector from '../components/StudentSelector';
import ViolationSelector from '../components/ViolationSelector';
import CameraCapture from '../components/CameraCapture';
import { resizeAndCompressImage } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>
);

const ViolationLogger: React.FC = () => {
  const { user } = useAuth();
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedViolations, setSelectedViolations] = useState<Violation[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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

  // Automatically select the logged-in teacher if they are not an admin
  useEffect(() => {
    if (user && !user.isAdmin && teachers.length > 0) {
        const loggedInTeacher = teachers.find(t => t.email.toLowerCase() === user.email?.toLowerCase());
        if (loggedInTeacher) {
            setSelectedTeacherId(String(loggedInTeacher.id));
        }
    }
  }, [user, teachers]);

  const resetForm = () => {
    setSelectedStudents([]);
    setSelectedViolations([]);
    setPhotos([]);
    photoPreviews.forEach(URL.revokeObjectURL);
    setPhotoPreviews([]);
    // Don't reset teacher if it's auto-filled
    if (user && user.isAdmin) {
      setSelectedTeacherId('');
    }
  };
  
  const processAndAddFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setStatusMessage({ type: 'info', message: `Memproses ${files.length} gambar...` });
    try {
        const processedFiles = await Promise.all(
            files.map(file => resizeAndCompressImage(file))
        );
        const newPhotos = [...photos, ...processedFiles];
        setPhotos(newPhotos);
        
        const newPreviews = [...photoPreviews];
        for (const file of processedFiles) {
            const previewUrl = URL.createObjectURL(file);
            newPreviews.push(previewUrl);
        }
        setPhotoPreviews(newPreviews);
        setStatusMessage(null);
    } catch (error) {
        console.error("Error processing image:", error);
        setStatusMessage({ type: 'error', message: 'Gagal memproses salah satu gambar.' });
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    await processAndAddFiles(files);
    e.target.value = '';
  };

  const handleCaptureComplete = async (file: File) => {
    setIsCameraOpen(false);
    if (file) {
      await processAndAddFiles([file]);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    URL.revokeObjectURL(photoPreviews[indexToRemove]);
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
    setPhotoPreviews(photoPreviews.filter((_, index) => index !== indexToRemove));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0 || selectedViolations.length === 0 || !selectedTeacherId) {
      setStatusMessage({ type: 'error', message: 'Harap lengkapi semua data: siswa, pelanggaran, dan guru pelapor.' });
      return;
    }
    
    setIsLoading(true);
    setStatusMessage(null);
    
    let photoUrls: string[] = [];
    if (photos.length > 0) {
      setIsUploading(true);
      setStatusMessage({type: 'info', message: `Mengunggah ${photos.length} foto...`});
      try {
        photoUrls = await Promise.all(photos.map(photo => uploadPhoto(photo)));
      } catch (error) {
        console.error('Failed to upload photos:', error);
        setStatusMessage({ type: 'error', message: 'Gagal mengunggah bukti foto.' });
        setIsLoading(false);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    try {
      await logViolation({
        student_ids: selectedStudents.map(s => s.id),
        violation_ids: selectedViolations.map(v => v.id),
        teacher_id: parseInt(selectedTeacherId, 10),
        photo_urls: photoUrls,
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
      {isCameraOpen && (
        <CameraCapture 
            onCapture={handleCaptureComplete} 
            onClose={() => setIsCameraOpen(false)} 
        />
      )}
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Form Pencatatan Pelanggaran</h2>
        
        {statusMessage && (
          <div className={`p-4 mb-4 text-sm rounded-lg ${
            statusMessage.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
            : statusMessage.type === 'error'
            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
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
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bukti Foto (Otomatis dikompres &lt; 100KB)
            </label>
            <div className="mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tambahkan bukti foto</p>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                    <button 
                        type="button" 
                        onClick={() => setIsCameraOpen(true)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 border border-transparent rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <CameraIcon className="w-5 h-5" />
                        Ambil Foto
                    </button>
                    <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 border border-transparent rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                        <UploadIcon className="w-5 h-5" />
                        <span>Pilih dari Galeri</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handlePhotoChange} disabled={isLoading} />
                    </label>
                </div>
            </div>

            {photoPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {photoPreviews.map((src, index) => (
                        <div key={src} className="relative group aspect-square">
                            <img src={src} alt={`Preview ${index + 1}`} className="h-full w-full object-cover rounded-md" />
                            <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="absolute top-1 right-1 bg-red-600/70 hover:bg-red-600 text-white rounded-full p-0.5"
                                aria-label="Hapus foto"
                                disabled={isLoading}
                            >
                                <XIcon className="w-3 h-3"/>
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div>
            <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Guru Pelapor
            </label>
            <select
              id="teacher"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              disabled={user ? !user.isAdmin : true}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
              required
            >
              <option value="" disabled>{user && user.isAdmin ? 'Pilih guru' : '...'}</option>
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
              {isLoading ? (isUploading ? `Mengunggah ${photos.length} foto...` : 'Menyimpan...') : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViolationLogger;