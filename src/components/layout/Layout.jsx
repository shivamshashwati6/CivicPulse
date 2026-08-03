import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans antialiased">
      <Navbar />
      <main className="flex-grow w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
