
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,36.16,44,30.634,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const SCHOOL_SHORT_NAME = "SMA Impian Bangsa";

const Login: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithGoogle, loginWithPassword } = useAuth();
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await loginWithGoogle();
            navigate('/log');
        } catch (err: any) {
            setError(err.message || 'Login Google gagal. Silakan coba lagi.');
            setIsLoading(false);
        }
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setError('Kata sandi tidak boleh kosong.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await loginWithPassword(password);
            navigate('/log');
        } catch (err: any) {
            setError(err.message || 'Login admin gagal.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Selamat Datang!</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sistem Pencatatan Pelanggaran {SCHOOL_SHORT_NAME}</p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg" role="alert">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                           <GoogleIcon />
                            Masuk dengan Google (untuk Guru)
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">atau</span>
                        </div>
                    </div>

                    <form className="space-y-4" onSubmit={handleAdminLogin}>
                        <div>
                            <label htmlFor="password-admin" className="sr-only">
                                Kata Sandi Admin
                            </label>
                            <input
                                id="password-admin"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Kata Sandi Admin"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {isLoading ? 'Memproses...' : 'Masuk sebagai Admin'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
