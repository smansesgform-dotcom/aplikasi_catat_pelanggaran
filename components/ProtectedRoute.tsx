
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            <span className="ml-4 text-gray-600 dark:text-gray-300">Memuat sesi...</span>
        </div>
    );
  }

  if (!user) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to send them along to that page after they login,
    // which is a nicer user experience than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !user.isAdmin) {
    // If a non-admin user tries to access an admin-only route, redirect them.
    return <Navigate to="/log" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
