import React from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Link } from 'react-router-dom';
import SupportRequests from '../components/admin/SupportRequests';
import SupportRequestDetail from '../components/admin/SupportRequestDetail';

const AdminPanel = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t('admin.panel')}
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <Routes>
          <Route path="/" element={<SupportRequests />} />
          <Route path="/support/:id" element={<SupportRequestDetail />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPanel;