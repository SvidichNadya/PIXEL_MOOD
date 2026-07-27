import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const toggleLanguage = () => {
    const nextLang = currentLanguage === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg hover:bg-surfaceLight transition-colors text-sm font-medium text-text-secondary hover:text-text-primary"
      aria-label="Switch language"
    >
      {currentLanguage === 'ru' ? 'RU' : 'EN'}
    </button>
  );
};

export default LanguageSwitcher;