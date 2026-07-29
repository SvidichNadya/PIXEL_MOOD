// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import bridge from '@vkontakte/vk-bridge';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CalendarPage from './pages/CalendarPage';
import StatsPage from './pages/StatsPage';
import AdminPanel from './pages/AdminPanel';
import SupportPage from './pages/SupportPage';
import PrivateRoute from './components/common/PrivateRoute';
import { AuthProvider } from './hooks/useAuth';
import './i18n';

const App = () => {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const handleUpdateConfig = (event) => {
      if (event.detail?.scheme) {
        setTheme(event.detail.scheme);
        document.documentElement.className = event.detail.scheme === 'space_gray' ? 'dark' : '';
      }
    };

    bridge.subscribe(({ detail }) => {
      if (detail.type === 'VKWebAppUpdateConfig') {
        handleUpdateConfig(detail);
      }
    });

    bridge.send('VKWebAppGetConfig')
      .then((data) => {
        if (data?.scheme) {
          setTheme(data.scheme);
          document.documentElement.className = data.scheme === 'space_gray' ? 'dark' : '';
        }
      })
      .catch(() => {});

    return () => {
      bridge.unsubscribe();
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Navbar />
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Защищенные маршруты */}
            <Route path="/" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/calendar/:id" element={
              <PrivateRoute>
                <CalendarPage />
              </PrivateRoute>
            } />
            <Route path="/stats" element={
              <PrivateRoute>
                <StatsPage />
              </PrivateRoute>
            } />
            <Route path="/admin/*" element={
              <PrivateRoute>
                <AdminPanel />
              </PrivateRoute>
            } />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;