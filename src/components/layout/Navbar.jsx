import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Menu, X, PlusCircle, LayoutDashboard, Search, ShieldCheck, LogIn } from 'lucide-react';
import { NAV_LINKS, APP_NAME } from '../../utils/constants';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Civic<span className="text-blue-600">Pulse AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* CTA & Auth Action */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-600/30 transition-all hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleMenu}
              type="button"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/report"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700"
            >
              <PlusCircle className="w-4 h-4" />
              Report Issue
            </Link>
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-700 font-medium text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
