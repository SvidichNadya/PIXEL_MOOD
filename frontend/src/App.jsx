import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import CalendarPage from './pages/CalendarPage';
import StatsPage from './pages/StatsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminSupport from './pages/AdminSupport';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#ffffff',
              border: '1px solid #3d3d5c',
            },
          }}
        />
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Защищённые маршруты */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/calendar/:id" element={<CalendarPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/admin/support" element={<AdminSupport />} />
          </Route>

          {/* Редирект по умолчанию */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;