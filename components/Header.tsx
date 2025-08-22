import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SCHOOL_NAME = import.meta.env.VITE_SCHOOL_NAME || "Aplikasi Pelanggaran";

const HamburgerIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const CloseIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };
  
  const closeMenu = () => setIsMobileMenuOpen(false);

  const activeLinkClass = 'bg-blue-600 text-white';
  const inactiveLinkClass = 'text-gray-300 hover:bg-blue-700 hover:text-white';
  const linkBaseClass = 'px-3 py-2 rounded-md text-sm font-medium transition-colors';
  const mobileLinkClass = 'block px-3 py-2 rounded-md text-base font-medium';

  return (
    <header className="bg-blue-800 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">{SCHOOL_NAME}</h1>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <NavLink to="/log" className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Catat Pelanggaran</NavLink>
                <NavLink to="/reports" className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Laporan</NavLink>
                {user.isAdmin && (
                  <NavLink to="/admin" className={({ isActive }) => `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Admin</NavLink>
                )}
                <span className="text-sm text-blue-200">|</span>
                <span className="text-white text-sm">Halo, {user.name}</span>
                <button onClick={handleLogout} className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">Logout</button>
              </>
            )}
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {user && (
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 focus:outline-none">
                <span className="sr-only">Buka menu</span>
                {isMobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <HamburgerIcon className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && user && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to="/log" onClick={closeMenu} className={({ isActive }) => `${mobileLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Catat Pelanggaran</NavLink>
            <NavLink to="/reports" onClick={closeMenu} className={({ isActive }) => `${mobileLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Laporan</NavLink>
            {user.isAdmin && (
              <NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => `${mobileLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass}`}>Admin</NavLink>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-blue-700">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">{user.name}</div>
                {user.email && <div className="text-sm font-medium leading-none text-blue-300">{user.email}</div>}
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-blue-700">Logout</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;