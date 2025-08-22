
import React from 'react';
import FileUpload from '../components/FileUpload';
import { uploadStudents, uploadTeachers, uploadViolations } from '../services/supabaseService';

const studentTemplate = [
    { nipd: '12345', nisn: '54321', name: 'Contoh Siswa', gender: 'L', class: 'X IPA 1' },
];

const teacherTemplate = [
    { name: 'Contoh Guru, S.Pd.', nip: '198001012005011001', email: 'guru@sekolah.id' },
];

const violationTemplate = [
    { name: 'Contoh Pelanggaran', points: 10 },
];

const Admin: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Panel Admin - Unggah Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                <FileUpload
                    title="Unggah Data Siswa"
                    templateFileName="template_siswa.xlsx"
                    templateData={studentTemplate}
                    onUpload={uploadStudents}
                />
                <FileUpload
                    title="Unggah Data Guru"
                    templateFileName="template_guru.xlsx"
                    templateData={teacherTemplate}
                    onUpload={uploadTeachers}
                />
                <FileUpload
                    title="Unggah Data Pelanggaran"
                    templateFileName="template_pelanggaran.xlsx"
                    templateData={violationTemplate}
                    onUpload={uploadViolations}
                />
            </div>
        </div>
    );
};

export default Admin;
