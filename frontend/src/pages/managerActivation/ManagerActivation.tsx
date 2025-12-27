import React, { useState, useEffect, useCallback } from 'react';
import { managerAPI } from '../../services/api';
import Header from '../../components/header/Header';
import { InactiveManager, PageResponse } from '../../types';
import styles from './ManagerActivation.module.scss';
import '../App.css';

const ManagerActivation: React.FC = () => {
  const [managers, setManagers] = useState<InactiveManager[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const pageSize = 10;

  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const loadManagers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await managerAPI.getInactive(currentPage, pageSize);
      const pageData = response.data as PageResponse<InactiveManager>;
      setManagers(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || 'Ошибка загрузки данных');
      console.error('Error loading managers:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const handleActivate = useCallback(async (userId: number) => {
    if (!window.confirm('Вы уверены, что хотите активировать этого менеджера?')) {
      return;
    }

    try {
      await managerAPI.activate(userId);
      // Reload the current page
      loadManagers();
    } catch (err: any) {
      alert(err.response?.data?.errorMessage || 'Ошибка активации менеджера');
      console.error('Error activating manager:', err);
    }
  }, [loadManagers]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  if (loading && managers.length === 0) {
    return (
      <div>
        <Header />
        <div className={`container ${styles.container}`}>
          <div>Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className={`container ${styles.container}`}>
        <h2>Активация менеджеров</h2>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {managers.length === 0 && !loading ? (
          <div className={styles.emptyMessage}>
            <p>Нет неактивированных менеджеров</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <p>Всего неактивированных менеджеров: {totalElements}</p>
            </div>

            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHead}>
                  <th className={styles.tableHeader}>ID</th>
                  <th className={styles.tableHeader}>Имя пользователя</th>
                  <th className={styles.tableHeader}>Полное имя</th>
                  <th className={styles.tableHeader}>Email</th>
                  <th className={styles.tableHeader}>Дата регистрации</th>
                  <th className={`${styles.tableHeader} ${styles.center}`}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((manager) => (
                  <tr key={manager.userId} className={styles.tableRow}>
                    <td className={styles.tableCell}>{manager.userId}</td>
                    <td className={styles.tableCell}>{manager.username}</td>
                    <td className={styles.tableCell}>{manager.fullName}</td>
                    <td className={styles.tableCell}>{manager.email}</td>
                    <td className={styles.tableCell}>{formatDate(manager.registrationDate)}</td>
                    <td className={`${styles.tableCell} ${styles.center}`}>
                      <button
                        onClick={() => handleActivate(manager.userId)}
                        className={`btn btn-primary ${styles.activateButton}`}
                      >
                        Активировать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(0)}
                disabled={currentPage === 0}
                className={`btn ${styles.paginationButton}`}
              >
                Первая
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className={`btn ${styles.paginationButton}`}
              >
                Предыдущая
              </button>
              <span className={styles.pageInfo}>
                Страница {currentPage + 1} из {totalPages || 1}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className={`btn ${styles.paginationButton}`}
              >
                Следующая
              </button>
              <button
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className={`btn ${styles.paginationButton}`}
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

