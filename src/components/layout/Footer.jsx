import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Heart, MapPin, CheckCircle2 } from 'lucide-react';
import { APP_NAME } from '../../utils/constants';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Civic<span className="text-blue-400">Pulse AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering citizens and local municipalities with instant AI vision triage for faster civic problem resolution.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Platform Systems Operational
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              </li>
              <li>
                <Link to="/report" className="hover:text-white transition-colors">Report Issue</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">Track Status</Link>
              </li>
            </ul>
          </div>

          {/* Civic Issues */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Categories</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="hover:text-slate-300">Potholes & Road Damage</li>
              <li className="hover:text-slate-300">Streetlight Failure</li>
              <li className="hover:text-slate-300">Garbage & Waste Removal</li>
              <li className="hover:text-slate-300">Water Leakage & Mains</li>
            </ul>
          </div>

          {/* Platform Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Stack Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built on React, Tailwind CSS, Supabase PostgreSQL & Auth, prepared for Gemini AI & OpenStreetMap integration.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 text-xs font-medium text-blue-400 border border-slate-700">
              <Shield className="w-3.5 h-3.5" />
              Encrypted Civic Data
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} CivicPulse AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">API Docs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
