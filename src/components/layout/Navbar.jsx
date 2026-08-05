import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Menu, X, PlusCircle, LogOut, LayoutDashboard, User, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    setIsOpen(false);
    const { error } = await logout();
    if (error) {
      toast.error(error.message || 'Logout failed.');
    } else {
      toast.success('Logged out successfully.');
      navigate('/');
    }
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (href) => {
    setIsOpen(false);
    if (href.startsWith('#')) {
      if (location.pathname !== '/') {
        window.location.href = '/' + href;
        return;
      }
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Civic<span className="text-blue-600">Pulse AI</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (item.href.startsWith('#')) {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }
                }}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {item.name}
              </a>
            ))}
            
            {user && (
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}

            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Admin Portal
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200/80 text-xs font-medium text-gray-700">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="max-w-[140px] truncate">{user.user_metadata?.full_name || user.email}</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-rose-600"
                >
                  <LogOut className="w-4 h-4 mr-2 text-gray-500 hover:text-rose-600" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="outline" className="text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-blue-600 font-medium">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Citizen Login
                </Button>
              </Link>
            )}

            <Link to="/report">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20">
                <PlusCircle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              type="button"
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-gray-100 bg-white px-4 pt-2 pb-6 space-y-3">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (item.href.startsWith('#')) {
                  e.preventDefault();
                  handleNavClick(item.href);
                } else {
                  setIsOpen(false);
                }
              }}
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              {item.name}
            </a>
          ))}

          {user && (
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Dashboard
            </Link>
          )}

          <Link
            to={isAdmin ? '/admin' : '/admin/login'}
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-800 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Admin Portal
          </Link>

          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
            {user ? (
              <>
                <div className="px-3 py-1.5 text-xs text-gray-500 font-medium truncate">
                  Logged in as <span className="font-semibold text-gray-800">{user.email}</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-center text-gray-700 border-gray-200"
                >
                  <LogOut className="w-4 h-4 mr-2 text-rose-500" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full justify-center text-gray-700 border-gray-200">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Citizen Login
                </Button>
              </Link>
            )}

            <Link to="/report" onClick={() => setIsOpen(false)}>
              <Button className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700 font-semibold">
                <PlusCircle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
