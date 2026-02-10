import React, { useEffect, useState, useRef } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { classSessionAPI } from '../../services/api';
import { Event, EventDTO } from '../../types';
import styles from './EventLog.module.scss';

interface EventLogProps {
  classId: number;
  onClose?: () => void; // Optional for inline display
  inline?: boolean; // If true, display inline instead of modal
}

const EventLog: React.FC<EventLogProps> = ({ classId, onClose, inline = false }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null); // Store subscription to avoid duplicates

  useEffect(() => {
    loadInitialEvents();
    
    // Subscribe to WebSocket events if inline mode
    if (inline) {
      // Delay WebSocket setup slightly to ensure initial events are loaded first
      const timeoutId = setTimeout(() => {
        setupWebSocketSubscription();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        if (stompClientRef.current && stompClientRef.current.connected) {
          stompClientRef.current.deactivate();
          stompClientRef.current = null;
        }
      };
    }
    
    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [classId, inline]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInitialEvents = async () => {
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

  const setupWebSocketSubscription = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found for WebSocket connection');
      return;
    }

    // If already connected, unsubscribe from old topic and subscribe to new one
    if (stompClientRef.current && stompClientRef.current.connected) {
      // Unsubscribe from previous subscription if exists
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      const topic = `/topic/class/${classId}/events`;
      console.log('Already connected, subscribing to class events:', topic);
      
      // Subscribe to class events
      subscriptionRef.current = stompClientRef.current.subscribe(topic, (message: IMessage) => {
        try {
          const event: EventDTO = JSON.parse(message.body);
          console.log('Received class event:', event);
          
          // Add new event to the list
          setEvents(prev => {
            // Check if event already exists (avoid duplicates)
            if (prev.some(e => e.id === event.id)) {
              console.log('Event already exists, skipping:', event.id);
              return prev;
            }
            
            // Convert EventDTO to Event format (null -> undefined)
            const newEvent: Event = {
              id: event.id,
              time: event.time,
              type: event.type as any,
              teamId: event.teamId ?? undefined,
              userRoleId: event.userRoleId ?? undefined,
              submissionId: event.submissionId ?? undefined,
              classId: event.classId ?? undefined,
              taskId: event.taskId ?? undefined,
            };
            
            console.log('Adding new event to list:', newEvent);
            // Add to beginning of list (most recent first)
            return [newEvent, ...prev];
          });
        } catch (err) {
          console.error('Error parsing class event:', err);
        }
      });
      return;
    }

    // Create new connection
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
        console.log('WebSocket connected for class events, classId:', classId);
        
        // Subscribe to class events
        const topic = `/topic/class/${classId}/events`;
        subscriptionRef.current = client.subscribe(topic, (message: IMessage) => {
          try {
            const event: EventDTO = JSON.parse(message.body);
            console.log('Received class event:', event);
            
            // Add new event to the list
            setEvents(prev => {
              // Check if event already exists (avoid duplicates)
              if (prev.some(e => e.id === event.id)) {
                console.log('Event already exists, skipping:', event.id);
                return prev;
              }
              
              // Convert EventDTO to Event format (null -> undefined)
              const newEvent: Event = {
                id: event.id,
                time: event.time,
                type: event.type as any,
                teamId: event.teamId ?? undefined,
                userRoleId: event.userRoleId ?? undefined,
                submissionId: event.submissionId ?? undefined,
                classId: event.classId ?? undefined,
                taskId: event.taskId ?? undefined,
              };
              
              console.log('Adding new event to list:', newEvent);
              // Add to beginning of list (most recent first)
              return [newEvent, ...prev];
            });
          } catch (err) {
            console.error('Error parsing class event:', err);
          }
        });
        console.log('Subscribed to class events:', topic);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },
    });
    
    client.activate();
    stompClientRef.current = client;
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

  if (inline) {
    return (
      <div className={styles.inlineContainer}>
        <h3 className={styles.inlineTitle}>Лог событий</h3>
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
      </div>
    );
  }

  // Modal mode - only show if onClose is provided
  if (!onClose) {
    return null;
  }

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
          <button className={styles.button} onClick={loadInitialEvents}>Обновить</button>
          <button className={styles.buttonSecondary} onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default EventLog;
