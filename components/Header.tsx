import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || "Aplikasi Pelanggaran";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeLinkClass = 'bg-blue-600 text-white';
  const inactiveLinkClass = 'text-gray-300 hover:bg-blue-700 hover:text-white';
  const linkBaseClass = 'px-3 py-2 rounded-md text-sm font-medium transition-colors';

  return (
    <header className="bg-blue-800 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">{SCHOOL_NAME}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <NavLink
                  to="/log"
                  className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                  Catat Pelanggaran
                </NavLink>
                <NavLink
                  to="/reports"
                  className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                >
                  Laporan
                </NavLink>
                {user.isAdmin && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}
                  >
                    Admin
                  </NavLink>
                )}
                <span className="text-sm text-blue-200 hidden sm:block">|</span>
                <span className="text-white text-sm hidden md:block">Halo, {user.name}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;