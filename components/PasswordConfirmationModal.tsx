import React, { useState, useEffect } from 'react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

interface PasswordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const PasswordConfirmationModal: React.FC<PasswordConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setIsConfirming(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    if (password === ADMIN_PASSWORD) {
      setError('');
      setIsConfirming(true);
      onConfirm();
    } else {
      setError('Kata sandi admin salah. Silakan coba lagi.');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-opacity" 
        onClick={handleBackdropClick}
        aria-modal="true"
        role="dialog"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">{title}</h2>
        <div className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
          {children}
        </div>
        <div className="space-y-2">
          <label htmlFor="admin-password-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Masukkan Kata Sandi Admin untuk Konfirmasi
          </label>
          <input
            id="admin-password-confirm"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Kata Sandi Admin"
            autoFocus
            disabled={isConfirming}
          />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={isConfirming || !password}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
          >
            {isConfirming ? 'Memproses...' : 'Konfirmasi & Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordConfirmationModal;