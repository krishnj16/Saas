import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';


import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';

import DashboardPage from './pages/Dashboard/DashboardPage';

import WebsitesListPage from './pages/Websites/WebsitesListPage';
import WebsiteDetailPage from './pages/Websites/WebsiteDetailPage';

import FindingsListPage from './pages/Findings/FindingsListPage';
import FindingDetailPage from './pages/Findings/FindingDetailPage';

import NotificationsPage from './pages/Notifications/NotificationsPage';

import UsersPage from './pages/Admin/UsersPage';


import NotFoundPage from './pages/Misc/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {}
          {}
          <Route element={<PrivateRoute />}>
            
            {}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {}
            <Route path="/websites" element={<WebsitesListPage />} />
            <Route path="/websites/:id" element={<WebsiteDetailPage />} />

            {}
            <Route path="/findings" element={<FindingsListPage />} />
            <Route path="/findings/:id" element={<FindingDetailPage />} />

            {}
            <Route path="/notifications" element={<NotificationsPage />} />
            
            {}
            <Route element={<AdminRoute />}>
               {}
               <Route path="/admin/users" element={<UsersPage />} />
            </Route>

          </Route>

          {}
          {}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;