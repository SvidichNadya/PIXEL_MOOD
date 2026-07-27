import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const AdminSupport = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [filter, setFilter] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await client.get(ENDPOINTS.ADMIN.SUPPORT_REQUESTS, {
        params: { resolved: filter === 'resolved' ? true : filter === 'unresolved' ? false : undefined }
      });
      setRequests(res.data);
    } catch (e) {
      toast.error('Ошибка загрузки заявок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const openDetail = async (id) => {
    try {
      const res = await client.get(ENDPOINTS.ADMIN.SUPPORT_REQUEST_DETAIL(id));
      setSelectedRequest(res.data);
      setShowDetail(true);
      setResponseText('');
    } catch (e) {
      toast.error('Ошибка загрузки деталей');
    }
  };

  const handleResolve = async () => {
    if (!responseText.trim()) {
      toast.error('Введите текст ответа');
      return;
    }
    try {
      await client.post(ENDPOINTS.ADMIN.RESOLVE_REQUEST(selectedRequest.id), {
        response_message: responseText
      });
      toast.success('Заявка решена, уведомление отправлено');
      setShowDetail(false);
      loadRequests();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Ошибка');
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-secondary">Доступ запрещён</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">Заявки в поддержку</h1>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-lg text-sm ${filter === '' ? 'bg-accent-blue text-white' : 'bg-surfaceLight text-text-secondary'}`}
        >
          Все
        </button>
        <button
          onClick={() => setFilter('unresolved')}
          className={`px-4 py-2 rounded-lg text-sm ${filter === 'unresolved' ? 'bg-accent-blue text-white' : 'bg-surfaceLight text-text-secondary'}`}
        >
          Не решены
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg text-sm ${filter === 'resolved' ? 'bg-accent-blue text-white' : 'bg-surfaceLight text-text-secondary'}`}
        >
          Решены
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <p className="text-text-muted">Нет заявок</p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              onClick={() => openDetail(req.id)}
              className={`bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-accent-blue transition-colors ${req.resolved ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-text-primary">{req.username || 'Аноним'}</p>
                  <p className="text-sm text-text-secondary truncate max-w-md">{req.message}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {format(new Date(req.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${req.resolved ? 'bg-green-500/20 text-green-400' : 'bg-accent-red/20 text-accent-red'}`}>
                  {req.resolved ? 'Решено' : 'Ожидает'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка деталей */}
      {showDetail && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Заявка от {selectedRequest.username || 'Анонима'}</h2>
              <button onClick={() => setShowDetail(false)} className="p-1 hover:bg-surfaceLight rounded-lg">
                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-muted">Дата</p>
                <p className="text-text-primary">{format(new Date(selectedRequest.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Сообщение</p>
                <p className="text-text-primary whitespace-pre-wrap bg-surfaceLight p-3 rounded-lg">{selectedRequest.message}</p>
              </div>
              {selectedRequest.resolved && (
                <div>
                  <p className="text-sm text-text-muted">Ответ администратора</p>
                  <p className="text-text-primary whitespace-pre-wrap bg-surfaceLight p-3 rounded-lg">{selectedRequest.admin_response}</p>
                </div>
              )}
              {!selectedRequest.resolved && (
                <div>
                  <label className="block text-sm text-text-muted mb-1">Ваш ответ</label>
                  <textarea
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full resize-none"
                    placeholder="Введите ответ пользователю..."
                  />
                  <button
                    onClick={handleResolve}
                    className="btn-primary mt-2"
                  >
                    Отправить и закрыть
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupport;