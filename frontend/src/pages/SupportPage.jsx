// frontend/src/pages/SupportPage.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const SupportPage = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t('support.title') || 'Поддержка'}
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">
          {t('support.description') || 'Страница в разработке. Пожалуйста, воспользуйтесь формой в модальном окне.'}
        </p>
      </div>
    </div>
  );
};

export default SupportPage;