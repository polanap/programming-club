import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/header/Header';
import EventLog from '../../components/eventLog/EventLog';
import { classAPI, scheduleAPI, teamAPI, teamChangeRequestAPI, classSessionAPI, taskAPI } from '../../services/api';
import { ClassResponseDTO, Schedule, TeamResponseDTO, TeamChangeRequest, Task } from '../../types';
import styles from '../transferRequest/TransferRequest.module.scss';

type ClassWithSchedule = ClassResponseDTO & { schedule?: Schedule };

function parseISODateToLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function combineDateAndTime(classDate: string, timeStr: string): Date {
  const date = parseISODateToLocal(classDate);
  const [hh, mm, ss] = (timeStr || '00:00:00').split(':').map(n => parseInt(n, 10));
  date.setHours(hh || 0, mm || 0, ss || 0, 0);
  return date;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const CuratorGroupClasses: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [classes, setClasses] = useState<ClassWithSchedule[]>([]);

  // lesson menu modal
  const [showLessonMenu, setShowLessonMenu] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithSchedule | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // team distribution for selected class
  const [teams, setTeams] = useState<TeamResponseDTO[]>([]);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(false);
  const [teamsError, setTeamsError] = useState<string>('');
  const [teamBlockStatuses, setTeamBlockStatuses] = useState<Record<number, { isBlocked: boolean; loading: boolean }>>({});

  // team change requests for selected class
  const [teamChangeRequests, setTeamChangeRequests] = useState<TeamChangeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [requestsError, setRequestsError] = useState<string>('');

  const [showTeamsModal, setShowTeamsModal] = useState<boolean>(false);
  const [showTeamChangeRequestsModal, setShowTeamChangeRequestsModal] = useState<boolean>(false);
  const [showTasksModal, setShowTasksModal] = useState<boolean>(false);
  const [showEventLog, setShowEventLog] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // tasks management for selected class
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [classWithTasks, setClassWithTasks] = useState<ClassResponseDTO | null>(null);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);

  useEffect(() => {
    if (!showLessonMenu) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [showLessonMenu]);

  const startAt = useMemo(() => {
    if (!selectedClass?.schedule) return null;
    return combineDateAndTime(selectedClass.classDate, selectedClass.schedule.classStartTime);
  }, [selectedClass]);

  const endAt = useMemo(() => {
    if (!selectedClass?.schedule) return null;
    return combineDateAndTime(selectedClass.classDate, selectedClass.schedule.classEndTime);
  }, [selectedClass]);

  const isStarted = useMemo(() => {
    if (!startAt) return false;
    return now >= startAt.getTime();
  }, [now, startAt]);

  const isEnded = useMemo(() => {
    if (!endAt) return false;
    return now >= endAt.getTime();
  }, [now, endAt]);

  const countdown = useMemo(() => {
    if (!startAt) return '—';
    return formatCountdown(startAt.getTime() - now);
  }, [startAt, now]);

  const lessonStatusText = useMemo(() => {
    if (!startAt || !endAt) return '—';
    if (isEnded) return 'Занятие уже кончилось';
    if (isStarted) return 'Занятие началось';
    return `До начала: ${countdown}`;
  }, [startAt, endAt, isStarted, isEnded, countdown]);

  const load = async () => {
    if (!groupId) return;
    try {
      setError('');
      setLoading(true);
      const res = await classAPI.getByGroup(parseInt(groupId));
      const classList: ClassResponseDTO[] = Array.isArray(res.data) ? res.data : [];
      
      // Load schedules for each class
      const classesWithSchedules = await Promise.all(
        classList.map(async (c) => {
          try {
            const scheduleRes = await scheduleAPI.getById(c.scheduleId);
            return { ...c, schedule: scheduleRes.data };
          } catch {
            return { ...c, schedule: undefined };
          }
        })
      );
      
      setClasses(classesWithSchedules);
    } catch (err: any) {
      setError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка загрузки занятий');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadTeamsForClass = async (classId: number) => {
    try {
      setLoadingTeams(true);
      setTeamsError('');
      const res = await teamAPI.getByClass(classId);
      const teamsData = Array.isArray(res.data) ? res.data : [];
      setTeams(teamsData);
      
      // Load block status for each team
      const statusPromises = teamsData.map(async (team) => {
        try {
          const statusRes = await classSessionAPI.getTeamStatus(team.teamId);
          return { teamId: team.teamId, status: statusRes.data };
        } catch (err) {
          console.error(`Error loading status for team ${team.teamId}:`, err);
          return { teamId: team.teamId, status: { isBlocked: false } };
        }
      });
      
      const statuses = await Promise.all(statusPromises);
      const statusMap: Record<number, { isBlocked: boolean; loading: boolean }> = {};
      statuses.forEach(({ teamId, status }) => {
        statusMap[teamId] = { isBlocked: status.isBlocked, loading: false };
      });
      setTeamBlockStatuses(statusMap);
    } catch (err: any) {
      setTeamsError(err.response?.data?.message || 'Ошибка загрузки команд');
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadTeamChangeRequestsForClass = async (classId: number) => {
    try {
      setLoadingRequests(true);
      setRequestsError('');
      const res = await teamChangeRequestAPI.getByClass(classId);
      setTeamChangeRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setRequestsError(err.response?.data?.message || 'Ошибка загрузки заявок');
      setTeamChangeRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadClassDetails = async (classId: number) => {
    try {
      const res = await classAPI.getById(classId);
      setClassWithTasks(res.data);
    } catch (error) {
      console.error('Error loading class details:', error);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await taskAPI.getAvailableForCurator();
      setAvailableTasks(res.data || []);
    } catch (error) {
      console.error('Error loading available tasks:', error);
      setAvailableTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleAssignTask = async () => {
    if (!selectedClass?.id || !selectedTaskId) {
      setActionError('Выберите задание');
      return;
    }
    try {
      setActionError('');
      await classAPI.assignTask(selectedClass.id, selectedTaskId);
      setSelectedTaskId(null);
      await loadClassDetails(selectedClass.id);
      setActionSuccess('Задание успешно привязано к занятию');
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Ошибка при привязке задания');
    }
  };

  const handleRemoveTask = async (taskId: number) => {
    if (!selectedClass?.id) return;
    if (!window.confirm('Вы уверены, что хотите отвязать это задание от занятия?')) return;
    try {
      setActionError('');
      await classAPI.removeTask(selectedClass.id, taskId);
      await loadClassDetails(selectedClass.id);
      setActionSuccess('Задание успешно отвязано от занятия');
    } catch (error: any) {
      setActionError(error.response?.data?.message || 'Ошибка при отвязке задания');
    }
  };

  const openLessonMenu = async (c: ClassWithSchedule) => {
    setSelectedClass(c);
    setShowLessonMenu(true);
    setActionError('');
    setActionSuccess('');
    setTeams([]);
    setClassWithTasks(null);
    setSelectedTaskId(null);
    if (c?.id) {
      await Promise.all([
        loadTeamsForClass(c.id),
        loadTeamChangeRequestsForClass(c.id),
        loadClassDetails(c.id),
        loadAvailableTasks(),
      ]);
    }
  };

  const processTeamChangeRequest = async (requestId: number, approved: boolean) => {
    try {
      setActionError('');
      await teamChangeRequestAPI.process(requestId, approved);
      setActionSuccess(`Заявка ${approved ? 'одобрена' : 'отклонена'}`);
      if (selectedClass?.id) {
        await loadTeamChangeRequestsForClass(selectedClass.id);
        await loadTeamsForClass(selectedClass.id);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Ошибка при обработке заявки');
    }
  };

  const connectToClass = async () => {
    if (!selectedClass?.id) return;
    try {
      // Log join event before navigating
      await classSessionAPI.joinAsCurator(selectedClass.id);
      navigate(`/classroom/${selectedClass.id}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Ошибка при присоединении к занятию';
      setActionError(errorMsg);
    }
  };

  const toggleTeamBlock = async (teamId: number) => {
    const currentStatus = teamBlockStatuses[teamId];
    const newBlocked = !currentStatus?.isBlocked;
    
    // Set loading state
    setTeamBlockStatuses(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], loading: true }
    }));
    
    try {
      await classSessionAPI.blockTeamSubmission(teamId, newBlocked);
      // Reload status
      const statusRes = await classSessionAPI.getTeamStatus(teamId);
      setTeamBlockStatuses(prev => ({
        ...prev,
        [teamId]: { isBlocked: statusRes.data.isBlocked, loading: false }
      }));
      setActionSuccess(`Команда #${teamId} ${newBlocked ? 'заблокирована' : 'разблокирована'} для отправки решений`);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Ошибка при изменении статуса блокировки');
      setTeamBlockStatuses(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], loading: false }
      }));
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
        <h2>Занятия группы #{groupId}</h2>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.requestsList}>
          {classes.length === 0 ? (
            <p>Занятий нет</p>
          ) : (
            classes.map(c => {
              const start = c.schedule ? combineDateAndTime(c.classDate, c.schedule.classStartTime) : null;
              const end = c.schedule ? combineDateAndTime(c.classDate, c.schedule.classEndTime) : null;
              return (
                <div
                  key={c.id}
                  className={styles.requestCard}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openLessonMenu(c)}
                >
                  <div className={styles.requestHeader}>
                    <h4>Занятие #{c.id}</h4>
                  </div>
                  <div className={styles.requestDetails}>
                    <p><strong>Дата:</strong> {c.classDate}</p>
                    <p><strong>Начало:</strong> {start ? start.toLocaleString('ru-RU') : '—'}</p>
                    <p><strong>Окончание:</strong> {end ? end.toLocaleString('ru-RU') : '—'}</p>
                  </div>
                  <div className={styles.requestActions}>
                    <button
                      className={styles.buttonSmall}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClass(c);
                        setShowEventLog(true);
                      }}
                    >
                      Посмотреть лог событий
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.buttonSecondary} onClick={() => navigate('/curator/groups')}>Назад к группам</button>
          <button className={styles.button} onClick={load}>Обновить</button>
        </div>
      </div>

      {showLessonMenu && selectedClass && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Меню занятия #{selectedClass.id}</h3>

            {actionError && <div className={styles.error}>{actionError}</div>}
            {actionSuccess && <div className={styles.info}>{actionSuccess}</div>}

            <div className={styles.requestDetails}>
              <p><strong>{lessonStatusText}</strong></p>
              <button className={styles.button} onClick={connectToClass} disabled={!isStarted || isEnded}>
                Подключиться к занятию
              </button>
            </div>

            <div className={styles.requestActions} style={{ marginTop: 15 }}>
              <button
                className={styles.buttonSecondary}
                onClick={() => setShowTeamsModal(true)}
              >
                Посмотреть разбиение на команды
              </button>
              <button
                className={styles.buttonSecondary}
                onClick={() => setShowEventLog(true)}
              >
                Посмотреть лог событий
              </button>
              <button
                className={styles.buttonSecondary}
                onClick={() => setShowTeamChangeRequestsModal(true)}
              >
                Посмотреть заявки на смену команды ({teamChangeRequests.length})
              </button>
              <button
                className={styles.buttonSecondary}
                onClick={() => setShowTasksModal(true)}
              >
                Управление заданиями ({classWithTasks?.tasks?.length || 0})
              </button>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={() => {
                  setShowLessonMenu(false);
                  setSelectedClass(null);
                  setShowTeamsModal(false);
                  setShowTeamChangeRequestsModal(false);
                  setShowTasksModal(false);
                  setShowEventLog(false);
                  setActionError('');
                  setActionSuccess('');
                  setClassWithTasks(null);
                  setSelectedTaskId(null);
                  setAvailableTasks([]);
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {showTeamsModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Разбиение на команды</h3>
            {loadingTeams ? (
              <div className={styles.loading}>Загрузка...</div>
            ) : teamsError ? (
              <div className={styles.error}>{teamsError}</div>
            ) : (
              <div className={styles.requestsList}>
                {(teams || []).map(t => {
                  const blockStatus = teamBlockStatuses[t.teamId];
                  const isBlocked = blockStatus?.isBlocked || false;
                  const isLoading = blockStatus?.loading || false;
                  
                  return (
                    <div key={t.teamId} className={styles.requestCard}>
                      <div className={styles.requestHeader}>
                        <h4>Команда #{t.teamId}</h4>
                        {isBlocked && (
                          <span style={{ 
                            backgroundColor: '#fff3cd', 
                            color: '#856404', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            Заблокирована
                          </span>
                        )}
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
                      <div className={styles.requestActions}>
                        <button
                          className={isBlocked ? styles.button : styles.buttonDanger}
                          onClick={() => toggleTeamBlock(t.teamId)}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Загрузка...' : (isBlocked ? 'Разблокировать отправку' : 'Заблокировать отправку')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.buttonSecondary} onClick={() => setShowTeamsModal(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {showTeamChangeRequestsModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Заявки на смену команды</h3>
            {loadingRequests ? (
              <div className={styles.loading}>Загрузка...</div>
            ) : requestsError ? (
              <div className={styles.error}>{requestsError}</div>
            ) : (
              <div className={styles.requestsList}>
                {teamChangeRequests.length === 0 ? (
                  <p>Заявок нет</p>
                ) : (
                  teamChangeRequests.map(req => (
                    <div key={req.id} className={styles.requestCard}>
                      <div className={styles.requestHeader}>
                        <h4>Заявка #{req.id}</h4>
                        <span className={styles.statusBadge}>{req.status}</span>
                      </div>
                      <div className={styles.requestDetails}>
                        <p><strong>Студент:</strong> {req.student?.user?.fullName || '—'}</p>
                        {req.toTeam && <p><strong>Целевая команда:</strong> #{req.toTeam.id}</p>}
                        {req.comment && <p><strong>Комментарий:</strong> {req.comment}</p>}
                        <p><strong>Время создания:</strong> {new Date(req.creationTime).toLocaleString('ru-RU')}</p>
                      </div>
                      {req.status === 'NEW' && (
                        <div className={styles.requestActions}>
                          <button
                            className={styles.button}
                            onClick={() => processTeamChangeRequest(req.id, true)}
                          >
                            Одобрить
                          </button>
                          <button
                            className={styles.buttonDanger}
                            onClick={() => processTeamChangeRequest(req.id, false)}
                          >
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.buttonSecondary} onClick={() => setShowTeamChangeRequestsModal(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {showTasksModal && selectedClass && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Управление заданиями для занятия #{selectedClass.id}</h3>

            {actionError && <div className={styles.error}>{actionError}</div>}
            {actionSuccess && <div className={styles.info}>{actionSuccess}</div>}

            <div className={styles.requestDetails}>
              <h4>Привязанные задания ({classWithTasks?.tasks?.length || 0}):</h4>
              {loadingTasks ? (
                <div className={styles.loading}>Загрузка заданий...</div>
              ) : classWithTasks?.tasks && classWithTasks.tasks.length > 0 ? (
                <div className={styles.requestsList} style={{ marginBottom: 15 }}>
                  {classWithTasks.tasks.map((task) => (
                    <div key={task.id} className={styles.requestCard}>
                      <div className={styles.requestHeader}>
                        <h4>Задание #{task.id}</h4>
                      </div>
                      <div className={styles.requestDetails}>
                        <p>{task.condition}</p>
                      </div>
                      <div className={styles.requestActions}>
                        <button
                          className={styles.buttonDanger}
                          onClick={() => handleRemoveTask(task.id)}
                        >
                          Отвязать
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6c757d', marginBottom: 15 }}>Нет привязанных заданий</p>
              )}

              <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid #dee2e6' }}>
                <h4>Добавить задание:</h4>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Выберите задание:</label>
                  <select
                    value={selectedTaskId || ''}
                    onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da'
                    }}
                  >
                    <option value="">Выберите задание</option>
                    {availableTasks
                      .filter(
                        (task) =>
                          !classWithTasks?.tasks?.some((t) => t.id === task.id)
                      )
                      .map((task) => (
                        <option key={task.id} value={task.id}>
                          Задание #{task.id}: {task.condition.substring(0, 60)}
                          {task.condition.length > 60 ? '...' : ''}
                        </option>
                      ))}
                  </select>
                </div>
                {selectedTaskId && (
                  <button
                    className={styles.button}
                    onClick={handleAssignTask}
                  >
                    Привязать задание
                  </button>
                )}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.buttonSecondary} onClick={() => setShowTasksModal(false)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {showEventLog && selectedClass && (
        <EventLog
          classId={selectedClass.id}
          onClose={() => {
            setShowEventLog(false);
          }}
        />
      )}
    </div>
  );
};

export default CuratorGroupClasses;
