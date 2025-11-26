import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';

// --- PAGE IMPORTS ---

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';

// Dashboard
import DashboardPage from './pages/Dashboard/DashboardPage';

// Websites Module
import WebsitesListPage from './pages/Websites/WebsitesListPage';
import WebsiteDetailPage from './pages/Websites/WebsiteDetailPage';

// Findings Module
import FindingsListPage from './pages/Findings/FindingsListPage';
import FindingDetailPage from './pages/Findings/FindingDetailPage';

// Notifications
import NotificationsPage from './pages/Notifications/NotificationsPage';

// Admin Module
import UsersPage from './pages/Admin/UsersPage';

// Misc
import NotFoundPage from './pages/Misc/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* --- Protected Routes --- */}
          {/* All routes inside here require the user to be logged in */}
          <Route element={<PrivateRoute />}>
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Websites Management */}
            <Route path="/websites" element={<WebsitesListPage />} />
            <Route path="/websites/:id" element={<WebsiteDetailPage />} />

            {/* Security Findings */}
            <Route path="/findings" element={<FindingsListPage />} />
            <Route path="/findings/:id" element={<FindingDetailPage />} />

            {/* User Notifications */}
            <Route path="/notifications" element={<NotificationsPage />} />
            
            {/* --- Admin Only Routes --- */}
            <Route element={<AdminRoute />}>
               {/* Corrected import used here: UsersPage */}
               <Route path="/admin/users" element={<UsersPage />} />
            </Route>

          </Route>

          {/* --- Catch-All Route --- */}
          {/* Any URL not matched above will show the 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;