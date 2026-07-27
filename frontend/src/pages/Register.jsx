import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import VKAuth from '../components/auth/VKAuth';

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-surface rounded-2xl border border-border p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Регистрация</h1>
          <p className="text-text-secondary text-sm mt-2">Присоединяйтесь к мировому дневнику настроения</p>
        </div>

        <RegisterForm />

        <div className="mt-6">
          <VKAuth />
        </div>

      </div>
    </div>
  );
};

export default Register;