import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getTeacherByEmail } from '../services/supabaseService';
import type { AuthUser } from '../types';
import type { Session } from '@supabase/supabase-js';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
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

  // This function centralizes session processing
  const processSession = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    const { email } = session.user;
    
    // Check if the logged-in user is the admin
    if (email && ADMIN_EMAIL && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setUser({ name: 'Admin', email, isAdmin: true });
      return;
    }

    // Otherwise, check if they are a registered teacher
    const teacher = await getTeacherByEmail(email!);
    if (teacher) {
      setUser({ name: teacher.name, email: teacher.email, isAdmin: false });
    } else {
      // If a user is authenticated with Google but not in the teachers table, log them out.
      console.warn(`User ${email} is not a registered teacher. Logging out.`);
      await supabase.auth.signOut();
      setUser(null);
    }
  };
  
  useEffect(() => {
    setIsLoading(true);

    // Check for an existing session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      processSession(session).finally(() => setIsLoading(false));
    });

    // Listen for auth state changes (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await processSession(session);
      setIsLoading(false); // Ensure loading is false after any auth change
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      console.error("Google login error:", error);
      throw new Error('Gagal memulai login Google.');
    }
  };

  const loginWithPassword = async (password: string) => {
    // First, verify the password entered in the form matches the env var
    if (password !== ADMIN_PASSWORD) {
      throw new Error('Kata sandi admin tidak valid.');
    }
    
    // Then, use the admin credentials from env vars to sign in to Supabase
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error('Konfigurasi email atau kata sandi admin tidak ditemukan.');
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (error) {
        console.error("Admin sign in error:", error);
        throw new Error(`Gagal login sebagai admin. Pesan: ${error.message}`);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
    // The onAuthStateChange listener will handle setting the user to null
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
