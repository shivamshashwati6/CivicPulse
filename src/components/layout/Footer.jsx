import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Civic<span className="text-blue-500">Pulse AI</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              AI-powered civic issue reporting platform empowering citizens to report public infrastructure problems and enabling municipal authorities to fix them faster.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              National Level Hackathon Prototype
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#home" className="hover:text-white transition-colors">Home</a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">Contact Us</a>
              </li>
            </ul>
          </div>

          {/* Core Routes */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Application</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/report" className="hover:text-white transition-colors">Report Issue</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">Track Reports</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">Citizen Dashboard</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">Admin Panel</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact Info</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>support@civicpulse.ai</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>+1 (800) 555-CIVIC</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>Municipal Technology Hub, City Center</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 text-gray-500">
          <p>© {new Date().getFullYear()} CivicPulse AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-400 cursor-pointer">Security Overview</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
