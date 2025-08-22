
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTeacherByEmail } from '../services/supabaseService';
import type { AuthUser } from '../types';

// This is a mock of environment variables.
// In a Vite/Create-React-App setup, you'd use import.meta.env.VITE_ADMIN_PASSWORD
const ADMIN_PASSWORD = "adminrahasia123"; 

interface AuthContextType {
  user: AuthUser | null;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      sessionStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async () => {
    // This is a MOCK. In a real app, you would integrate a Google Auth library (e.g., @react-oauth/google).
    // For this simulation, we'll try to log in as the first teacher from our mock data.
    const mockTeacherEmail = 'ahmad.fauzi@sekolah.id';
    const teacher = await getTeacherByEmail(mockTeacherEmail);
    if (teacher) {
      const authUser: AuthUser = { name: teacher.name, email: teacher.email, isAdmin: false };
      sessionStorage.setItem('user', JSON.stringify(authUser));
      setUser(authUser);
    } else {
        throw new Error("Login Gagal: Guru demo tidak ditemukan.");
    }
  };

  const loginWithPassword = async (password: string) => {
    if (password === ADMIN_PASSWORD) {
      const adminUser: AuthUser = { name: 'Admin', isAdmin: true };
      sessionStorage.setItem('user', JSON.stringify(adminUser));
      setUser(adminUser);
    } else {
      throw new Error('Kata sandi admin tidak valid.');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, loginWithPassword, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
