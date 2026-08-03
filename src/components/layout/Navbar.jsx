import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Menu, X, PlusCircle, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

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
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline" className="text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-blue-600">
                <LogIn className="w-4 h-4 mr-2 text-gray-500" />
                Sign In
              </Button>
            </Link>
            <Link to="/report">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-600/20">
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
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-center text-gray-700 border-gray-200">
                <LogIn className="w-4 h-4 mr-2 text-gray-500" />
                Sign In
              </Button>
            </Link>
            <Link to="/report" onClick={() => setIsOpen(false)}>
              <Button className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700">
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
