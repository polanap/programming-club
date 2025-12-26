import React, { useState, useEffect } from 'react';
import { managerAPI } from '../services/api';
import Header from '../components/Header';
import '../App.css';

const ManagerActivation = () => {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadManagers();
  }, [currentPage]);

  const loadManagers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await managerAPI.getInactive(currentPage, pageSize);
      setManagers(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch (err) {
      setError(err.response?.data?.errorMessage || 'Ошибка загрузки данных');
      console.error('Error loading managers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите активировать этого менеджера?')) {
      return;
    }

    try {
      await managerAPI.activate(userId);
      // Reload the current page
      loadManagers();
    } catch (err) {
      alert(err.response?.data?.errorMessage || 'Ошибка активации менеджера');
      console.error('Error activating manager:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && managers.length === 0) {
    return (
      <div>
        <Header />
        <div className="container" style={{ marginTop: '20px' }}>
          <div>Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container" style={{ marginTop: '20px', maxWidth: '1200px' }}>
        <h2>Активация менеджеров</h2>
        
        {error && (
          <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {managers.length === 0 && !loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Нет неактивированных менеджеров</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <p>Всего неактивированных менеджеров: {totalElements}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Имя пользователя</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Полное имя</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Дата регистрации</th>
                  <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.userId} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{manager.userId}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{manager.username}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{manager.fullName}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{manager.email}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{formatDate(manager.registrationDate)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleActivate(manager.userId)}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px' }}
                      >
                        Активировать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
                className="btn"
                style={{ padding: '8px 16px', opacity: currentPage === 0 ? 0.5 : 1 }}
              >
                Первая
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="btn"
                style={{ padding: '8px 16px', opacity: currentPage === 0 ? 0.5 : 1 }}
              >
                Предыдущая
              </button>
              <span style={{ padding: '8px 16px' }}>
                Страница {currentPage + 1} из {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="btn"
                style={{ padding: '8px 16px', opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
              >
                Следующая
              </button>
              <button
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className="btn"
                style={{ padding: '8px 16px', opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
              >
                Последняя
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerActivation;

