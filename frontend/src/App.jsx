import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

import PrivateRoute from './routes/PrivateRoute';
import AdminRoute from './routes/AdminRoute';

// Real Pages
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import DashboardPage from './pages/Dashboard/DashboardPage';

// Remaining Placeholders
const WebsitesList = () => <div className="p-4">Websites Placeholder</div>;
const UsersList = () => <div className="p-4">Admin Users List Placeholder</div>;
const NotFound = () => <div className="p-4">404 Not Found</div>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            
            <Route path="/websites" element={<WebsitesList />} />
            
            <Route element={<AdminRoute />}>
               <Route path="/admin/users" element={<UsersList />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;