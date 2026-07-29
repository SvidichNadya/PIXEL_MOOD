import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SupportModal from '../components/support/SupportModal';

const SupportPage = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t('support.title') || 'Поддержка'}
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('support.description') || 'Опишите вашу проблему, и мы свяжемся с вами в ближайшее время.'}
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t('support.open_form') || 'Открыть форму обращения'}
        </button>
      </div>
      <SupportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default SupportPage;