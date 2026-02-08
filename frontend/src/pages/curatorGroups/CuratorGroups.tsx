import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import { groupAPI } from '../../services/api';
import { Group } from '../../types';
import styles from '../transferRequest/TransferRequest.module.scss';

const CuratorGroups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await groupAPI.getMyCuratorGroups();
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка загрузки групп');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <h2>Мои группы</h2>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.requestsList}>
          {groups.length === 0 ? (
            <p>Вы не состоите ни в одной группе</p>
          ) : (
            groups.map(g => (
              <div
                key={g.id}
                className={styles.requestCard}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/curator/groups/${g.id}`)}
              >
                <div className={styles.requestHeader}>
                  <h4>Группа #{g.id}</h4>
                </div>
                <div className={styles.requestDetails}>
                  <p><strong>Старт группы:</strong> {g.startTime ? new Date(g.startTime).toLocaleString('ru-RU') : '—'}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.buttonSecondary} onClick={() => navigate('/curator')}>Назад</button>
          <button className={styles.button} onClick={load}>Обновить</button>
        </div>
      </div>
    </div>
  );
};

export default CuratorGroups;
