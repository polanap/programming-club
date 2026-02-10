import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { classSessionAPI } from '../../services/api';
import { Submission, EventDTO } from '../../types';
import styles from './SubmissionList.module.scss';

interface SubmissionListProps {
  teamId: number;
  inline?: boolean; // If true, display inline instead of modal
}

const SubmissionList: React.FC<SubmissionListProps> = ({ teamId, inline = false }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await classSessionAPI.getTeamSubmissions(teamId);
      setSubmissions(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки попыток');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const setupWebSocketSubscription = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found for WebSocket connection');
      return;
    }

    const topic = `/topic/team/${teamId}/events`;

    // If client exists and is connected, just subscribe/resubscribe
    if (stompClientRef.current && stompClientRef.current.connected) {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      console.log('Already connected, subscribing to team events for submissions:', topic);
      subscriptionRef.current = stompClientRef.current.subscribe(topic, (message: IMessage) => {
        try {
          const event: EventDTO = JSON.parse(message.body);
          console.log('Received team event for submissions:', event);

          // Reload submissions when a new submission is sent or result is received
          if (event.type === 'TEAM_SENT_SOLUTION' || event.type === 'RESULT_OF_SOLUTION') {
            console.log('Reloading submissions due to event:', event.type);
            loadSubmissions();
          }
        } catch (err) {
          console.error('Error parsing team event:', err);
        }
      });
      return;
    }

    // Create new connection if not connected
    const socket = new SockJS('http://localhost:8181/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 0,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log('WebSocket connected for submissions, teamId:', teamId);

        subscriptionRef.current = client.subscribe(topic, (message: IMessage) => {
          try {
            const event: EventDTO = JSON.parse(message.body);
            console.log('Received team event for submissions:', event);

            // Reload submissions when a new submission is sent or result is received
            if (event.type === 'TEAM_SENT_SOLUTION' || event.type === 'RESULT_OF_SOLUTION') {
              console.log('Reloading submissions due to event:', event.type);
              loadSubmissions();
            }
          } catch (err) {
            console.error('Error parsing team event:', err);
          }
        });
        console.log('Subscribed to team events for submissions:', topic);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        subscriptionRef.current = null;
      },
    });

    client.activate();
    stompClientRef.current = client;
  }, [teamId, loadSubmissions]);

  useEffect(() => {
    loadSubmissions();

    if (inline) {
      const timeoutId = setTimeout(() => {
        setupWebSocketSubscription();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (stompClientRef.current && stompClientRef.current.connected) {
          stompClientRef.current.deactivate();
          stompClientRef.current = null;
          subscriptionRef.current = null;
        }
      };
    }

    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        subscriptionRef.current = null;
      }
    };
  }, [teamId, inline, loadSubmissions, setupWebSocketSubscription]);

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      NEW: 'Новая',
      IN_PROCESS: 'В обработке',
      OK: 'Успешно',
      FAILED: 'Неудачно',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string): string => {
    const classes: Record<string, string> = {
      NEW: styles.statusNew,
      IN_PROCESS: styles.statusInProcess,
      OK: styles.statusOk,
      FAILED: styles.statusFailed,
    };
    return classes[status] || '';
  };

  const formatDuration = (duration: string): string => {
    try {
      // Parse ISO 8601 duration (e.g., "PT1H30M" or "PT45S")
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return duration;

      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);

      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours}ч`);
      if (minutes > 0) parts.push(`${minutes}м`);
      if (seconds > 0 || parts.length === 0) parts.push(`${seconds}с`);

      return parts.join(' ');
    } catch {
      return duration;
    }
  };

  if (inline) {
    return (
      <div className={styles.inlineContainer}>
        <h3 className={styles.inlineTitle}>Мои попытки</h3>
        {error && <div className={styles.error}>{error}</div>}
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <div className={styles.submissionsList}>
            {submissions.length === 0 ? (
              <p>Попыток нет</p>
            ) : (
              submissions.map(submission => (
                <div key={submission.id} className={styles.submissionItem}>
                  <div className={styles.submissionHeader}>
                    <span className={styles.submissionId}>Попытка #{submission.id}</span>
                    <span className={`${styles.status} ${getStatusClass(submission.status)}`}>
                      {getStatusLabel(submission.status)}
                    </span>
                  </div>
                  <div className={styles.submissionDetails}>
                    <div>Задача: #{submission.taskId}</div>
                    {submission.complitionTime && (
                      <div>Время: {formatDuration(submission.complitionTime)}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default SubmissionList;
