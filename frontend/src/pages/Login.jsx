import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import VKAuth from '../components/auth/VKAuth';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-surface rounded-2xl border border-border p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Вход в PIXEL Mood</h1>
          <p className="text-text-secondary text-sm mt-2">Войдите, чтобы оставить свой след</p>
        </div>

        <LoginForm />

        <div className="mt-6">
          <VKAuth />
        </div>

      </div>
    </div>
  );
};

export default Login;