import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import bridge from '@vkontakte/vk-bridge';

// Инициализация VK Mini App — ОБЯЗАТЕЛЬНО!
bridge.send('VKWebAppInit')
  .then(() => {
    console.log('VK Bridge initialized successfully');
  })
  .catch((error) => {
    console.error('VK Bridge initialization failed:', error);
  });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);