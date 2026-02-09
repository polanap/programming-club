import React, { useEffect, useState } from 'react';
import { classSessionAPI } from '../../services/api';
import { Event } from '../../types';
import styles from './EventLog.module.scss';

interface EventLogProps {
  classId: number;
  onClose: () => void;
}

const EventLog: React.FC<EventLogProps> = ({ classId, onClose }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, [classId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await classSessionAPI.getClassEvents(classId);
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки событий');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      TEAM_RAISED_HAND: 'Поднята рука',
      TEAM_LOWERED_HAND: 'Опущена рука',
      CURATOR_BLOCKED_TEAM: 'Команда заблокирована',
      CURATOR_UNBLOCKED_TEAM: 'Команда разблокирована',
      CURATOR_JOINED_TEAM: 'Куратор присоединился к команде',
      CURATOR_LEFT_TEAM: 'Куратор покинул команду',
      CURATOR_JOINED_CLASS: 'Куратор присоединился к занятию',
      CURATOR_LEFT_CLASS: 'Куратор покинул занятие',
      STUDENT_JOINED_CLASS: 'Студент присоединился к занятию',
      STUDENT_LEFT_CLASS: 'Студент покинул занятие',
      TEAM_SENT_SOLUTION: 'Команда отправила решение',
      RESULT_OF_SOLUTION: 'Результат проверки решения',
      TEAM_BEGAN_TO_COMPLETE_TASK: 'Команда начала выполнять задачу',
    };
    return labels[type] || type;
  };

  const formatTime = (time: string): string => {
    try {
      return new Date(time).toLocaleString('ru-RU');
    } catch {
      return time;
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h3>Лог событий занятия #{classId}</h3>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <div className={styles.eventsList}>
            {events.length === 0 ? (
              <p>Событий нет</p>
            ) : (
              events.map(event => (
                <div key={event.id} className={styles.eventItem}>
                  <div className={styles.eventTime}>{formatTime(event.time)}</div>
                  <div className={styles.eventType}>{getEventTypeLabel(event.type)}</div>
                  {event.teamId && <div className={styles.eventDetail}>Команда #{event.teamId}</div>}
                  {event.taskId && <div className={styles.eventDetail}>Задача #{event.taskId}</div>}
                </div>
              ))
            )}
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.button} onClick={loadEvents}>Обновить</button>
          <button className={styles.buttonSecondary} onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default EventLog;
