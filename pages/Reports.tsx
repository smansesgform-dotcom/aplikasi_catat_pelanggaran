import React, { useState, useEffect, useCallback } from 'react';
import type { Teacher, Violation, Student, EnrichedViolationRecord, ReportFilters, StudentSummary } from '../types';
import { getTeachers, getViolations, getClasses, getViolationRecords } from '../services/supabaseService';
import StudentSelector from '../components/StudentSelector';
import { generateExcel, generatePdf } from '../utils/reportUtils';

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const Reports: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().split('T')[0];

    const [filters, setFilters] = useState<ReportFilters>({
        startDate: lastMonthStr,
        endDate: today,
        class: '',
        studentIds: [],
        violationId: '',
        teacherId: '',
    });
    
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [violations, setViolations] = useState<Violation[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    
    const [reportData, setReportData] = useState<EnrichedViolationRecord[]>([]);
    const [studentSummary, setStudentSummary] = useState<StudentSummary[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'summary'>('details');


    const fetchDropdownData = useCallback(async () => {
        try {
            const [teachersData, violationsData, classesData] = await Promise.all([
                getTeachers(),
                getViolations(),
                getClasses(),
            ]);
            setTeachers(teachersData);
            setViolations(violationsData);
            setClasses(classesData);
        } catch (err) {
            setError('Gagal memuat data untuk filter.');
        }
    }, []);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);
    
    useEffect(() => {
      setFilters(prev => ({...prev, studentIds: selectedStudents.map(s => s.id)}));
    }, [selectedStudents]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value,
        });
    };

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError(null);
        setReportData([]);
        setStudentSummary([]);
        try {
            const data = await getViolationRecords(filters);
            setReportData(data);

            if (data.length === 0) {
              setError("Tidak ada data yang cocok dengan filter yang diberikan.");
            } else {
              // Calculate summary
              const summaryMap = new Map<string, StudentSummary>();
              data.forEach(record => {
                  const key = `${record.studentName}-${record.studentClass}`;
                  if (!summaryMap.has(key)) {
                      summaryMap.set(key, {
                          studentName: record.studentName,
                          studentClass: record.studentClass,
                          incidentCount: 0,
                          totalPoints: 0,
                      });
                  }
                  const current = summaryMap.get(key)!;
                  current.incidentCount += 1; // Each row in detailed report is one incident for a student
                  current.totalPoints += record.totalPoints;
                  summaryMap.set(key, current);
              });
              
              const calculatedSummary = Array.from(summaryMap.values())
                  .sort((a, b) => b.totalPoints - a.totalPoints);
              
              setStudentSummary(calculatedSummary);
              // Default to summary tab if there's data, as it's often more useful
              setActiveTab('summary');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat membuat laporan.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const hasData = reportData.length > 0;

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Laporan Pelanggaran</h2>
            
            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Date Range */}
                    <div className="flex flex-col">
                        <label htmlFor="startDate" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Mulai</label>
                        <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="form-input"/>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Akhir</label>
                        <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="form-input"/>
                    </div>
                    {/* Other Filters */}
                    <div className="flex flex-col">
                         <label htmlFor="class" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kelas (opsional)</label>
                         <select name="class" id="class" value={filters.class} onChange={handleFilterChange} className="form-select">
                            <option value="">Semua Kelas</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div className="flex flex-col">
                         <label htmlFor="teacherId" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guru Pelapor (opsional)</label>
                         <select name="teacherId" id="teacherId" value={filters.teacherId} onChange={handleFilterChange} className="form-select">
                            <option value="">Semua Guru</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                     <div className="flex flex-col">
                         <label htmlFor="violationId" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Pelanggaran (opsional)</label>
                         <select name="violationId" id="violationId" value={filters.violationId} onChange={handleFilterChange} className="form-select">
                            <option value="">Semua Pelanggaran</option>
                            {violations.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                     <div className="md:col-span-2 lg:col-span-3">
                         <StudentSelector selectedStudents={selectedStudents} onSelectedStudentsChange={setSelectedStudents} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={handleGenerateReport} disabled={isLoading} className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        {isLoading ? 'Membuat Laporan...' : 'Buat Laporan'}
                    </button>
                </div>
            </div>

            {isLoading && <div className="text-center p-4">Memuat data...</div>}
            {error && !isLoading && <div className="text-center p-4 text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-md">{error}</div>}
            
            {hasData && (
                 <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                <button onClick={() => setActiveTab('summary')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Ringkasan Siswa
                                </button>
                                <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                Laporan Rinci
                                </button>
                            </nav>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => generatePdf(reportData, studentSummary)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                                <DownloadIcon className="w-4 h-4" /> PDF
                            </button>
                            <button onClick={() => generateExcel(reportData, studentSummary)} className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                                 <DownloadIcon className="w-4 h-4" /> Excel
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="overflow-x-auto">
                        {activeTab === 'summary' && (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="th text-center">Peringkat</th>
                                        <th className="th">Nama Siswa</th>
                                        <th className="th">Kelas</th>
                                        <th className="th text-center">Jumlah Insiden</th>
                                        <th className="th text-center">Total Poin</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {studentSummary.map((row, index) => (
                                        <tr key={index}>
                                            <td className="td text-center">{index + 1}</td>
                                            <td className="td">{row.studentName}</td>
                                            <td className="td">{row.studentClass}</td>
                                            <td className="td text-center">{row.incidentCount}</td>
                                            <td className="td text-center font-bold">{row.totalPoints}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {activeTab === 'details' && (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="th">Tanggal & Waktu</th>
                                        <th className="th">Nama Siswa</th>
                                        <th className="th">Kelas</th>
                                        <th className="th">Pelanggaran</th>
                                        <th className="th text-center">Poin Insiden</th>
                                        <th className="th">Guru Pelapor</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {reportData.map((row, index) => (
                                        <tr key={`${row.id}-${index}`}>
                                            <td className="td">{row.timestamp}</td>
                                            <td className="td">{row.studentName}</td>
                                            <td className="td">{row.studentClass}</td>
                                            <td className="td">{row.violations}</td>
                                            <td className="td text-center">{row.totalPoints}</td>
                                            <td className="td">{row.teacherName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                     </div>
                </div>
            )}
        </div>
    );
};

export default Reports;

// Basic styling for form elements and table cells to reduce repetition
// In a real app, these would be in a global CSS file or a base component
const css = `
  .form-input, .form-select {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    border: 1px solid #D1D5DB; /* gray-300 */
    border-radius: 0.375rem; /* rounded-md */
    background-color: #FFFFFF; /* white */
    color: #111827; /* gray-900 */
  }
  .dark .form-input, .dark .form-select {
    border-color: #4B5563; /* dark:gray-600 */
    background-color: #374151; /* dark:gray-700 */
    color: #F9FAFB; /* dark:gray-50 */
  }
  .th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151; /* gray-700 */
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .dark .th {
    color: #D1D5DB; /* dark:gray-300 */
  }
  .td {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    white-space: nowrap;
  }
`;
const style = document.createElement('style');
if (!document.head.querySelector('style#report-styles')) {
    style.id = 'report-styles';
    style.textContent = css;
    document.head.append(style);
}
