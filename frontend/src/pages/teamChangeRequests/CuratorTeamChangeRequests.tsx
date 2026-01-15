import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../components/header/Header';
import { teamChangeRequestAPI } from '../../services/api';
import { TeamChangeRequest } from '../../types';
import styles from '../transferRequest/TransferRequest.module.scss';

const CuratorTeamChangeRequests: React.FC = () => {
  const [requests, setRequests] = useState<TeamChangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showOnlyNew, setShowOnlyNew] = useState<boolean>(true);

  const visibleRequests = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    return showOnlyNew ? list.filter(r => r.status === 'NEW') : list;
  }, [requests, showOnlyNew]);

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await teamChangeRequestAPI.getAll();
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка загрузки заявок');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const process = async (requestId: number, approved: boolean) => {
    try {
      setError('');
      await teamChangeRequestAPI.process(requestId, approved);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка обработки заявки');
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h2>Заявки на смену команды</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button className={styles.buttonSecondary} onClick={() => setShowOnlyNew(v => !v)}>
            {showOnlyNew ? 'Показать все' : 'Показать только новые'}
          </button>
          <button className={styles.button} onClick={load}>
            Обновить
          </button>
        </div>

        <div className={styles.requestsList}>
          {visibleRequests.length === 0 ? (
            <p>Нет заявок</p>
          ) : (
            visibleRequests.map(r => (
              <div key={r.id} className={styles.requestCard}>
                <div className={styles.requestHeader}>
                  <h4>Заявка #{r.id}</h4>
                  <span className={`${styles.status} ${styles[`status${r.status}`] || ''}`}>{r.status}</span>
                </div>

                <div className={styles.requestDetails}>
                  <p><strong>Ученик:</strong> {r.student?.user?.fullName || `UserRole #${r.student?.id}`}</p>
                  <p><strong>Из команды:</strong> {r.fromTeam?.id ? `#${r.fromTeam.id}` : '—'}</p>
                  <p><strong>В команду:</strong> {r.toTeam?.id ? `#${r.toTeam.id}` : '—'}</p>
                  <p><strong>Комментарий:</strong> {r.comment || '—'}</p>
                  <p><strong>Создана:</strong> {r.creationTime ? new Date(r.creationTime).toLocaleString('ru-RU') : '—'}</p>
                </div>

                {r.status === 'NEW' && (
                  <div className={styles.requestActions}>
                    <button className={styles.button} onClick={() => process(r.id, true)}>
                      Одобрить
                    </button>
                    <button className={styles.buttonDanger} onClick={() => process(r.id, false)}>
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CuratorTeamChangeRequests;

