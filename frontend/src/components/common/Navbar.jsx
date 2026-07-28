import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import NotificationsDropdown from '../notifications/NotificationsDropdown';
import SupportModal from '../support/SupportModal';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await client.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('expires_at');
      logout();
      setIsLoggingOut(false);
      setIsMenuOpen(false);
      toast.success('Вы вышли из аккаунта');
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Глобальный' },
    { path: '/profile', label: 'Профиль' },
    { path: '/stats', label: 'Статистика' },
  ];

  return (
    <>
      <nav className="bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Логотип */}
            <Link to="/" className="flex items-center space-x-2">
              <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="#151617" />

              <rect x="21" y="15" width="22" height="22" rx="6" fill="#F0D1D1" class="anim-rect" style="transform-origin: 32px 26px; animation-delay: 0s;" />
              
              <rect x="45" y="15" width="10" height="10" rx="3" fill="#E8D5B5" class="anim-rect" style="transform-origin: 50px 20px; animation-delay: 0.15s;" />
              <rect x="57" y="15" width="22" height="10" rx="4" fill="#B5C9D6" class="anim-rect" style="transform-origin: 68px 20px; animation-delay: 0.3s;" />
              
              <rect x="69" y="27" width="10" height="22" rx="4" fill="#C5D4B7" class="anim-rect" style="transform-origin: 74px 38px; animation-delay: 0.45s;" />
              
              <rect x="45" y="51" width="34" height="10" rx="4" fill="#EAC7A9" class="anim-rect" style="transform-origin: 62px 56px; animation-delay: 0.6s;" />
              
              <rect x="21" y="39" width="10" height="22" rx="4" fill="#BAC5CC" class="anim-rect" style="transform-origin: 26px 50px; animation-delay: 0.75s;" />
              <rect x="33" y="39" width="10" height="10" rx="3" fill="#B5D0C5" class="anim-rect" style="transform-origin: 38px 44px; animation-delay: 0.9s;" />
              <rect x="33" y="51" width="10" height="10" rx="3" fill="#C5BED6" class="anim-rect" style="transform-origin: 38px 56px; animation-delay: 1.05s;" />
              
              <rect x="21" y="63" width="22" height="22" rx="6" fill="#DBC6A1" class="anim-rect" style="transform-origin: 32px 74px; animation-delay: 1.2s;" />
            </svg>
              <span className="text-lg font-semibold text-text-primary hidden sm:block">
                PIXEL Mood
              </span>
            </Link>

            {/* Навигация (десктоп) */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-accent-blue/20 text-accent-blue'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surfaceLight'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {/* Ссылка на админку (только для админа) */}
              {user?.is_admin && (
                <Link
                  to="/admin/support"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-accent-blue hover:text-accent-purple hover:bg-surfaceLight"
                >
                  Админка
                </Link>
              )}
            </div>

            {/* Правая часть */}
            <div className="flex items-center space-x-4">
              {user && (
                <>

                  {/* Уведомления */}
                  <NotificationsDropdown />

                  {/* Аватар пользователя (десктоп) */}
                  <div className="hidden md:flex items-center space-x-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
                        <span className="text-accent-blue font-medium text-sm">
                          {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-text-secondary hidden lg:block">
                      {user.display_name}
                    </span>
                  </div>

                  {/* Кнопка поддержки */}
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="p-2 rounded-lg hover:bg-surfaceLight transition-colors"
                    aria-label="Поддержка"
                    title="Поддержка"
                  >
                    <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>

                  <LanguageSwitcher />

                </>
              )}

              {/* Кнопка меню (мобилка) */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-surfaceLight transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6 text-text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Мобильное меню */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border animate-slide-up">
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive(link.path)
                        ? 'bg-accent-blue/20 text-accent-blue'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surfaceLight'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {/* Админка в мобильном меню */}
                {user?.is_admin && (
                  <Link
                    to="/admin/support"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-accent-blue hover:text-accent-purple hover:bg-surfaceLight"
                  >
                    Админка
                  </Link>
                )}
                {user && (
                  <>
                    <div className="border-t border-border my-2" />
                    <div className="px-4 py-2 flex items-center space-x-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
                          <span className="text-accent-blue font-medium text-sm">
                            {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-text-secondary">{user.display_name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="px-4 py-2 text-sm text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors duration-200 text-left"
                    >
                      {isLoggingOut ? 'Выход...' : 'Выйти'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
    </>
  );
};

export default Navbar;