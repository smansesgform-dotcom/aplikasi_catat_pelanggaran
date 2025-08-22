import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getTeacherByEmail } from '../services/supabaseService';
import type { AuthUser } from '../types';
import type { Session } from '@supabase/supabase-js';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

interface AuthContextType {
  user: AuthUser | null;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const processSession = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    const teacher = await getTeacherByEmail(session.user.email!);
    if (teacher) {
      const authUser: AuthUser = { name: teacher.name, email: teacher.email, isAdmin: false };
      setUser(authUser);
    } else {
      console.warn(`User ${session.user.email} logged in but is not a registered teacher.`);
      // Optionally log them out if they are not a teacher
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // Check for local admin session first
    try {
      const savedUser = sessionStorage.getItem('admin_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsLoading(false);
        return;
      }
    } catch (error) {
        console.error("Failed to parse admin user from session storage", error);
        sessionStorage.removeItem('admin_user');
    }

    // Then check for Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        processSession(session).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Clear admin session if a Supabase user logs in/out
      sessionStorage.removeItem('admin_user');
      await processSession(session);
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
        console.error("Google login error:", error);
        throw new Error('Gagal memulai login Google.');
    }
  };

  const loginWithPassword = async (password: string) => {
    if (password === ADMIN_PASSWORD) {
      const adminUser: AuthUser = { name: 'Admin', isAdmin: true };
      sessionStorage.setItem('admin_user', JSON.stringify(adminUser));
      setUser(adminUser);
    } else {
      throw new Error('Kata sandi admin tidak valid.');
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('admin_user');
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Sign out error:", error);
    }
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