import React, { useMemo, useState } from 'react';
import Header from '../../components/header/Header';
import { teamAPI } from '../../services/api';
import { TeamResponseDTO } from '../../types';
import styles from '../transferRequest/TransferRequest.module.scss';

const ClassTeamsView: React.FC = () => {
  const [classId, setClassId] = useState<string>('');
  const [teams, setTeams] = useState<TeamResponseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const parsedClassId = useMemo(() => {
    const n = parseInt(classId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [classId]);

  const load = async () => {
    if (!parsedClassId) {
      setError('Введите корректный classId');
      return;
    }
    try {
      setError('');
      setLoading(true);
      const res = await teamAPI.getByClass(parsedClassId);
      setTeams(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка загрузки разбиения');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h2>Разбиение по командам</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label>ID занятия (classId):</label>
            <input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Например: 1" />
          </div>
          <button className={styles.button} onClick={load} disabled={loading}>
            {loading ? 'Загрузка...' : 'Показать'}
          </button>
        </div>

        <div className={styles.requestsList}>
          {teams.length === 0 ? (
            <p>Нет данных</p>
          ) : (
            teams.map(t => (
              <div key={t.teamId} className={styles.requestCard}>
                <div className={styles.requestHeader}>
                  <h4>Команда #{t.teamId}</h4>
                </div>
                <div className={styles.requestDetails}>
                  <p><strong>Староста:</strong> {t.elder?.fullName || '—'}</p>
                  <p><strong>Участники:</strong></p>
                  {t.members?.length ? (
                    <ul>
                      {t.members.map(m => (
                        <li key={m.userRoleId}>{m.fullName} (@{m.username})</li>
                      ))}
                    </ul>
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassTeamsView;

