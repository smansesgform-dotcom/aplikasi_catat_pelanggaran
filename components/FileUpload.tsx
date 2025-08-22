
import React, { useState, useRef } from 'react';

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

const UploadCloudIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
      <path d="M12 12v9"></path>
      <path d="m16 16-4-4-4 4"></path>
    </svg>
);


interface FileUploadProps {
  title: string;
  templateFileName: string;
  templateData: object[];
  onUpload: (data: any[]) => Promise<{ count: number }>;
}

const FileUpload: React.FC<FileUploadProps> = ({ title, templateFileName, templateData, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setStatus({ type: 'info', message: `File terpilih: ${e.target.files[0].name}` });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Silakan pilih file terlebih dahulu.' });
      return;
    }
    setIsLoading(true);
    setStatus({ type: 'info', message: 'Mengunggah dan memproses file...' });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = (window as any).XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = (window as any).XLSX.utils.sheet_to_json(worksheet);
        
        const result = await onUpload(json);

        setStatus({ type: 'success', message: `Berhasil! ${result.count} data berhasil diimpor.` });
        setFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        console.error('Upload failed:', error);
        setStatus({ type: 'error', message: 'Gagal memproses file. Pastikan formatnya sesuai template.' });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };
  
  const downloadTemplate = () => {
    const ws = (window as any).XLSX.utils.json_to_sheet(templateData);
    const wb = (window as any).XLSX.utils.book_new();
    (window as any).XLSX.utils.book_append_sheet(wb, ws, "Template");
    (window as any).XLSX.writeFile(wb, templateFileName);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={downloadTemplate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <DownloadIcon className="w-5 h-5" />
          Unduh Template
        </button>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <UploadCloudIcon className="w-5 h-5" />
        {isLoading ? 'Mengunggah...' : 'Unggah File'}
      </button>

      {status && (
        <div className={`p-3 text-sm rounded-md ${
          status.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
          status.type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
          'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
