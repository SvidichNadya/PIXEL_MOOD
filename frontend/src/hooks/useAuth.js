import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Хук для работы с аутентификацией
 * Использует контекст AuthContext
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;