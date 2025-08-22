import React, { useState, useRef } from 'react';
import FileUpload from '../components/FileUpload';
import PasswordConfirmationModal from '../components/PasswordConfirmationModal';
import { 
    uploadStudents, uploadTeachers, uploadViolations,
    backupTable, deleteAllFromTables, restoreData
} from '../services/supabaseService';
import type { AllDataBackup } from '../types';

const studentTemplate = [{ nipd: '12345', nisn: '0012345678', name: 'Contoh Siswa', gender: 'L', class: 'X IPA 1' }];
const teacherTemplate = [{ name: 'Contoh Guru, S.Pd.', nip: '198001012005011001', email: 'guru@sekolah.id' }];
const violationTemplate = [{ name: 'Contoh Pelanggaran', points: 10 }];

// Helper to trigger file download
const downloadJson = (data: object, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const Admin: React.FC = () => {
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const restoreFileInputRef = useRef<HTMLInputElement>(null);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title: string; message: React.ReactNode; onConfirm: () => Promise<void> } | null>(null);

    const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
        setStatusMessage({ type, message });
        setTimeout(() => setStatusMessage(null), 7000);
    };

    const handleAction = async (action: () => Promise<any>, successMessage: string, errorMessage: string) => {
        setIsLoading(true);
        showStatus('info', 'Memproses permintaan...');
        try {
            await action();
            showStatus('success', successMessage);
        } catch (error: any) {
            console.error(errorMessage, error);
            showStatus('error', `${errorMessage}: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Backup Logic ---
    const handleBackup = (tableName: 'students' | 'teachers' | 'violations') => {
        handleAction(
            async () => {
                const data = await backupTable(tableName);
                downloadJson(data, `backup_${tableName}_${new Date().toISOString().split('T')[0]}.json`);
            },
            `Backup data ${tableName} berhasil diunduh.`,
            `Gagal membuat backup data ${tableName}`
        );
    };
    
    const handleBackupAll = () => {
        handleAction(
            async () => {
                const [students, teachers, violations] = await Promise.all([
                    backupTable('students'),
                    backupTable('teachers'),
                    backupTable('violations')
                ]);
                const allData: AllDataBackup = { students, teachers, violations };
                downloadJson(allData, `backup_semua_data_${new Date().toISOString().split('T')[0]}.json`);
            },
            'Backup semua data berhasil diunduh.',
            'Gagal membuat backup semua data'
        );
    };

    // --- Restore Logic ---
    const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const isAllDataBackup = json.students && json.teachers && json.violations;
                const isSingleTableBackup = Array.isArray(json);

                if (!isAllDataBackup && !isSingleTableBackup) {
                    throw new Error("Format file JSON tidak dikenali.");
                }

                openConfirmationModal(
                    'Konfirmasi Pulihkan Data',
                    <>
                        <p>Anda akan memulihkan data dari file <span className="font-semibold">{file.name}</span>.</p>
                        <p className="font-bold text-red-500 mt-2">PERINGATAN: Semua data yang ada di tabel terkait akan DIHAPUS PERMANEN sebelum data baru diimpor. Tindakan ini tidak dapat diurungkan.</p>
                    </>,
                    async () => {
                        if(isAllDataBackup){
                            await handleAction(
                                async () => {
                                    await restoreData('students', json.students);
                                    await restoreData('teachers', json.teachers);
                                    await restoreData('violations', json.violations);
                                },
                                `Semua data berhasil dipulihkan.`,
                                `Gagal memulihkan semua data`
                            );
                        } else if (isSingleTableBackup) {
                            const fileName = file.name.toLowerCase();
                            let tableName: 'students' | 'teachers' | 'violations' | null = null;
                            if (fileName.includes('students')) tableName = 'students';
                            else if (fileName.includes('teachers')) tableName = 'teachers';
                            else if (fileName.includes('violations')) tableName = 'violations';
                            
                            if (tableName) {
                                await handleAction(
                                    async () => restoreData(tableName!, json),
                                    `Data ${tableName} berhasil dipulihkan.`,
                                    `Gagal memulihkan data ${tableName}`
                                );
                            } else {
                                showStatus('error', 'Nama file backup tidak valid. Gagal menentukan target tabel.');
                            }
                        }
                    }
                );

            } catch (error: any) {
                showStatus('error', `Gagal membaca file: ${error.message}`);
            } finally {
                if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    // --- Delete Logic ---
    const handleDelete = (tableName: 'students' | 'teachers' | 'violations' | 'all') => {
        const target = tableName === 'all' ? 'SEMUA DATA' : `data ${tableName}`;
        openConfirmationModal(
            `Konfirmasi Hapus ${target}`,
            <>
              <p>Anda akan menghapus <span className="font-bold">{target}</span> secara permanen.</p>
              <p className="font-bold text-red-500 mt-2">Tindakan ini tidak dapat diurungkan.</p>
            </>,
            async () => {
                await handleAction(
                    async () => {
                        const tablesToDelete: ('students' | 'teachers' | 'violations' | 'violation_records')[] = 
                            tableName === 'all' 
                                ? ['students', 'teachers', 'violations', 'violation_records'] 
                                : [tableName];
                        await deleteAllFromTables(tablesToDelete);
                    },
                    `${target} berhasil dihapus.`,
                    `Gagal menghapus ${target}`
                );
            }
        );
    };
    
    const openConfirmationModal = (title: string, message: React.ReactNode, onConfirm: () => Promise<void>) => {
        setModalConfig({ title, message, onConfirm: async () => {
            setIsModalOpen(false); // Close modal before action
            await onConfirm();
        }});
        setIsModalOpen(true);
    };

    const renderSection = (title: string, children: React.ReactNode) => (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h3>
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Panel Admin</h2>
            
            {statusMessage && (
              <div className={`p-4 text-sm rounded-lg ${
                statusMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                statusMessage.type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              }`}>
                {statusMessage.message}
              </div>
            )}
            
            {renderSection("Unggah Data Massal", (
                 <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <FileUpload title="Unggah Data Siswa" templateFileName="template_siswa.xlsx" templateData={studentTemplate} onUpload={uploadStudents} />
                    <FileUpload title="Unggah Data Guru" templateFileName="template_guru.xlsx" templateData={teacherTemplate} onUpload={uploadTeachers} />
                    <FileUpload title="Unggah Data Pelanggaran" templateFileName="template_pelanggaran.xlsx" templateData={violationTemplate} onUpload={uploadViolations} />
                </div>
            ))}

            {renderSection("Manajemen Data", (
                <>
                    <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Backup Data</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Unduh data saat ini sebagai file JSON.</p>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                            <button onClick={() => handleBackup('students')} disabled={isLoading} className="btn-secondary w-full sm:w-auto">Backup Siswa</button>
                            <button onClick={() => handleBackup('teachers')} disabled={isLoading} className="btn-secondary w-full sm:w-auto">Backup Guru</button>
                            <button onClick={() => handleBackup('violations')} disabled={isLoading} className="btn-secondary w-full sm:w-auto">Backup Pelanggaran</button>
                            <button onClick={handleBackupAll} disabled={isLoading} className="btn-primary w-full sm:w-auto">Backup Semua Data</button>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300">Pulihkan Data</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Pilih file backup JSON untuk memulihkan data. <span className="font-bold">Data yang ada akan dihapus terlebih dahulu.</span></p>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleRestoreFileSelected}
                            ref={restoreFileInputRef}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900"
                            disabled={isLoading}
                        />
                    </div>
                </>
            ))}

            {renderSection("Zona Berbahaya", (
                <div className="border-2 border-red-500/50 rounded-lg p-4 space-y-4">
                    <p className="text-sm text-red-600 dark:text-red-300">Tindakan di bawah ini bersifat permanen dan tidak dapat diurungkan. Lanjutkan dengan hati-hati.</p>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                       <button onClick={() => handleDelete('students')} disabled={isLoading} className="btn-danger w-full sm:w-auto">Hapus Semua Siswa</button>
                       <button onClick={() => handleDelete('teachers')} disabled={isLoading} className="btn-danger w-full sm:w-auto">Hapus Semua Guru</button>
                       <button onClick={() => handleDelete('violations')} disabled={isLoading} className="btn-danger w-full sm:w-auto">Hapus Semua Pelanggaran</button>
                       <button onClick={() => handleDelete('all')} disabled={isLoading} className="btn-danger font-bold w-full sm:w-auto">HAPUS SEMUA DATA APLIKASI</button>
                    </div>
                </div>
            ))}

            {isModalOpen && modalConfig && (
                <PasswordConfirmationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={modalConfig.onConfirm}
                    title={modalConfig.title}
                >
                    {modalConfig.message}
                </PasswordConfirmationModal>
            )}

            <style>{`
                .btn-primary { padding: 0.5rem 1rem; font-weight: 500; color: white; background-color: #2563EB; border-radius: 0.375rem; transition: background-color 0.2s; }
                .btn-primary:hover:not(:disabled) { background-color: #1D4ED8; }
                .btn-primary:disabled { background-color: #9CA3AF; cursor: not-allowed; }
                
                .btn-secondary { padding: 0.5rem 1rem; font-weight: 500; color: #374151; background-color: #E5E7EB; border-radius: 0.375rem; transition: background-color 0.2s; }
                .dark .btn-secondary { color: #E5E7EB; background-color: #4B5563; }
                .btn-secondary:hover:not(:disabled) { background-color: #D1D5DB; }
                .dark .btn-secondary:hover:not(:disabled) { background-color: #6B7280; }
                .btn-secondary:disabled { background-color: #F3F4F6; color: #9CA3AF; cursor: not-allowed; }
                .dark .btn-secondary:disabled { background-color: #374151; color: #9CA3AF; }

                .btn-danger { padding: 0.5rem 1rem; font-weight: 500; color: white; background-color: #DC2626; border-radius: 0.375rem; transition: background-color 0.2s; }
                .btn-danger:hover:not(:disabled) { background-color: #B91C1C; }
                .btn-danger:disabled { background-color: #F87171; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default Admin;