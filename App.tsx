
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import ViolationLogger from './pages/ViolationLogger';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/log" 
        element={
          <ProtectedRoute>
            <ViolationLogger />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute adminOnly={true}>
            <Admin />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to={user ? "/log" : "/login"} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen text-gray-800 dark:text-gray-200">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8">
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
