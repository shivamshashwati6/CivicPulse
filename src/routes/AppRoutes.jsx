import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';

import { LandingPage } from '../pages/Landing/LandingPage';
import { LoginPage } from '../pages/Login/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { ReportPage } from '../pages/Report/ReportPage';
import { TrackPage } from '../pages/Track/TrackPage';
import { AdminPage } from '../pages/Admin/AdminPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="admin" element={<AdminPage />} />
        {/* Fallback route */}
        <Route path="*" element={<LandingPage />} />
      </Route>
    </Routes>
  );
}
