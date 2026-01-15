import React, { useState } from 'react';
import Header from '../../components/header/Header';
import { elderChangeRequestAPI } from '../../services/api';
import styles from '../transferRequest/TransferRequest.module.scss';

const StudentElderChangeRequest: React.FC = () => {
  const [newElderId, setNewElderId] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(newElderId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Введите корректный ID нового старосты (UserRole ID)');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await elderChangeRequestAPI.create({ newElderId: parsed, comment: comment.trim() ? comment.trim() : undefined });
      setSuccess('Заявка отправлена');
      setNewElderId('');
      setComment('');
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка отправки заявки');
    }
  };

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h2>Заявка на смену старосты</h2>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.info}>{success}</div>}

        <div className={styles.form}>
          <h3>Создать заявку</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>ID нового старосты (UserRole ID):</label>
              <input
                value={newElderId}
                onChange={(e) => setNewElderId(e.target.value)}
                placeholder="Например: 123"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Комментарий (опционально):</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Поясните причину смены старосты..."
              />
            </div>
            <button type="submit" className={styles.button}>
              Отправить заявку
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentElderChangeRequest;

