import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppShell from './layouts/AppShell'; 
import Policies from './pages/Policies';

import Dashboard from './pages/Dashboard';       
import Sites from './pages/Sites';               
import Scans from './pages/Scans';               
import Findings from './pages/Findings';         
import FindingDetail from './pages/FindingDetail'; 
import Auth from './pages/Auth';                 

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('mock_token');
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {}
        <Route path="/auth" element={<Auth />} />

        {}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sites" element={<Sites />} />
                <Route path="/scans" element={<Scans />} />
                <Route path="/findings" element={<Findings />} />
                <Route path="/findings/:id" element={<FindingDetail />} />
                <Route path="/policies" element={<div><h2>Policies</h2></div>} />
                <Route path="*" element={<div>404 — Page not found</div>} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
