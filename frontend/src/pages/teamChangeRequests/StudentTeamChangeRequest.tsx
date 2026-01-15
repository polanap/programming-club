import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../components/header/Header';
import { teamAPI, teamChangeRequestAPI } from '../../services/api';
import { TeamResponseDTO } from '../../types';
import styles from '../transferRequest/TransferRequest.module.scss';

const StudentTeamChangeRequest: React.FC = () => {
  const [classId, setClassId] = useState<string>('');
  const [teams, setTeams] = useState<TeamResponseDTO[]>([]);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(false);
  const [toTeamId, setToTeamId] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const parsedClassId = useMemo(() => {
    const n = parseInt(classId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [classId]);

  const loadTeams = async () => {
    if (!parsedClassId) {
      setError('Введите корректный ID занятия (classId)');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoadingTeams(true);
      const res = await teamAPI.getByClass(parsedClassId);
      setTeams(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка загрузки команд');
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    setSuccess('');
  }, [classId, toTeamId, comment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toTeamId) {
      setError('Выберите команду');
      return;
    }

    try {
      setError('');
      await teamChangeRequestAPI.create({ toTeamId, comment: comment.trim() ? comment.trim() : undefined });
      setSuccess('Заявка отправлена');
      setToTeamId(0);
      setComment('');
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка отправки заявки');
    }
  };

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h2>Заявка на смену команды</h2>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.info}>{success}</div>}

        <div className={styles.form}>
          <h3>Выбор команды</h3>

          <div className={styles.formGroup}>
            <label>ID занятия (classId):</label>
            <input value={classId} onChange={(e) => setClassId(e.target.value)} placeholder="Например: 1" />
          </div>

          <button type="button" className={styles.button} onClick={loadTeams} disabled={loadingTeams}>
            {loadingTeams ? 'Загрузка...' : 'Загрузить команды'}
          </button>

          <div className={styles.formGroup} style={{ marginTop: 15 }}>
            <label>Команда, в которую хотите перейти:</label>
            <select value={toTeamId} onChange={(e) => setToTeamId(parseInt(e.target.value) || 0)}>
              <option value={0}>Выберите команду</option>
              {teams.map(t => (
                <option key={t.teamId} value={t.teamId}>
                  Команда #{t.teamId} (участников: {t.members?.length ?? 0})
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Комментарий (опционально):</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Поясните причину смены команды..."
              />
            </div>
            <button type="submit" className={styles.button} disabled={!toTeamId}>
              Отправить заявку
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentTeamChangeRequest;

