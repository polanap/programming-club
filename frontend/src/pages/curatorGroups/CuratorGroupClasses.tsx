import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/header/Header';
import { classAPI, scheduleAPI, teamAPI, teamChangeRequestAPI, taskAPI } from '../../services/api';
import { ClassResponseDTO, Schedule, TeamResponseDTO, TeamChangeRequest, Task } from '../../types';
import styles from '../transferRequest/TransferRequest.module.scss';

type ClassWithSchedule = ClassResponseDTO & { schedule?: Schedule };

function parseISODateToLocal(dateStr: string): Date {
  // dateStr: yyyy-mm-dd, treat as local date
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

  // team change requests for selected class
  const [teamChangeRequests, setTeamChangeRequests] = useState<TeamChangeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [requestsError, setRequestsError] = useState<string>('');

  // task management
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);

  const [showTeamsModal, setShowTeamsModal] = useState<boolean>(false);
  const [showTeamChangeRequestsModal, setShowTeamChangeRequestsModal] = useState<boolean>(false);
  const [showTasksModal, setShowTasksModal] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  
  // For moving students between teams
  const [movingStudent, setMovingStudent] = useState<{ userRoleId: number; currentTeamId: number; fullName: string } | null>(null);
  const [selectedTargetTeamId, setSelectedTargetTeamId] = useState<number>(0);

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
    if (isEnded) return 'Занятие уже закончилось';
    if (isStarted) return 'Занятие началось';
    return `До начала: ${countdown}`;
  }, [startAt, endAt, isStarted, isEnded, countdown]);

  const load = async () => {
    if (!groupId) return;
    try {
      setError('');
      setLoading(true);

      const schedulesRes = await scheduleAPI.getRelevantByGroup(parseInt(groupId, 10));
      const schedules = Array.isArray(schedulesRes.data) ? schedulesRes.data : [];
      const scheduleById = new Map<number, Schedule>(schedules.map(s => [s.id, s]));

      const classLists = await Promise.all(
        schedules.map(s => classAPI.getBySchedule(s.id).catch(() => ({ data: [] as any[] })))
      );
      const merged: ClassWithSchedule[] = classLists
        .flatMap(r => (Array.isArray(r.data) ? r.data : []))
        .map((c: ClassResponseDTO) => ({ ...c, schedule: scheduleById.get(c.scheduleId) }));

      merged.sort((a, b) => {
        const aStart = a.schedule ? combineDateAndTime(a.classDate, a.schedule.classStartTime).getTime() : 0;
        const bStart = b.schedule ? combineDateAndTime(b.classDate, b.schedule.classStartTime).getTime() : 0;
        return aStart - bStart;
      });

      setClasses(merged);
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
      setTeamsError('');
      setLoadingTeams(true);
      const res = await teamAPI.getByClass(classId);
      setTeams(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setTeamsError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка загрузки команд');
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadTeamChangeRequestsForClass = async (classId: number) => {
    try {
      setRequestsError('');
      setLoadingRequests(true);
      const res = await teamChangeRequestAPI.getAll();
      // Filter requests for this class - we need to check if the request is related to this class
      // Since API doesn't filter by class, we'll get all and filter by team's classId
      // For now, we'll show all requests and let backend handle filtering if needed
      const allRequests = Array.isArray(res.data) ? res.data : [];
      setTeamChangeRequests(allRequests);
    } catch (err: any) {
      setRequestsError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка загрузки заявок');
      setTeamChangeRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadAvailableTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await taskAPI.getAvailableForCurator();
      setAvailableTasks(res.data || []);
    } catch (err: any) {
      console.error('Error loading available tasks:', err);
      setAvailableTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadClassDetails = async () => {
    if (!selectedClass?.id) return;
    try {
      const res = await classAPI.getById(selectedClass.id);
      setSelectedClass({ ...res.data, schedule: selectedClass.schedule });
    } catch (err: any) {
      console.error('Error loading class details:', err);
    }
  };

  const openLessonMenu = async (c: ClassWithSchedule) => {
    setSelectedClass(c);
    setShowLessonMenu(true);
    setActionError('');
    setActionSuccess('');
    setTeams([]);
    if (c?.id) {
      await Promise.all([
        loadTeamsForClass(c.id),
        loadTeamChangeRequestsForClass(c.id),
        loadAvailableTasks(),
        loadClassDetails(),
      ]);
    }
  };

  const handleAssignTask = async () => {
    if (!selectedClass || !selectedTaskId) {
      setActionError('Выберите задание');
      return;
    }
    try {
      setActionError('');
      await classAPI.assignTask(selectedClass.id, selectedTaskId);
      setSelectedTaskId(null);
      await loadClassDetails();
      setActionSuccess('Задание успешно привязано к классу');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Ошибка при привязке задания');
    }
  };

  const handleRemoveTask = async (taskId: number) => {
    if (!selectedClass) return;
    if (!window.confirm('Вы уверены, что хотите отвязать это задание от класса?')) return;
    try {
      await classAPI.removeTask(selectedClass.id, taskId);
      await loadClassDetails();
      setActionSuccess('Задание успешно отвязано от класса');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Ошибка при отвязке задания');
    }
  };

  const processTeamChangeRequest = async (requestId: number, approved: boolean) => {
    try {
      setActionError('');
      await teamChangeRequestAPI.process(requestId, approved);
      setActionSuccess(`Заявка ${approved ? 'одобрена' : 'отклонена'}`);
      if (selectedClass?.id) {
        await loadTeamChangeRequestsForClass(selectedClass.id);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка обработки заявки');
    }
  };

  const handleMoveStudent = async () => {
    if (!movingStudent || !selectedTargetTeamId) {
      setActionError('Выберите целевую команду');
      return;
    }
    try {
      setActionError('');
      await teamChangeRequestAPI.moveStudent(movingStudent.userRoleId, selectedTargetTeamId);
      setActionSuccess(`Студент ${movingStudent.fullName} успешно перемещен в команду #${selectedTargetTeamId}`);
      setMovingStudent(null);
      setSelectedTargetTeamId(0);
      if (selectedClass?.id) {
        await Promise.all([
          loadTeamsForClass(selectedClass.id),
          loadTeamChangeRequestsForClass(selectedClass.id),
        ]);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка перемещения студента');
    }
  };

  const connectToClass = () => {
    if (!selectedClass?.id) return;
    navigate(`/classroom/${selectedClass.id}`);
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
                    <p><strong>Заданий:</strong> {c.tasks?.length || 0}</p>
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
            <h3>Информация о занятии #{selectedClass.id}</h3>

            {actionError && <div className={styles.error}>{actionError}</div>}
            {actionSuccess && <div className={styles.info}>{actionSuccess}</div>}
            {teamsError && <div className={styles.error}>{teamsError}</div>}
            {requestsError && <div className={styles.error}>{requestsError}</div>}

            <div className={styles.requestDetails}>
              <p><strong>Дата:</strong> {selectedClass.classDate}</p>
              <p><strong>Статус:</strong> {lessonStatusText}</p>
              <p><strong>Время начала:</strong> {startAt ? startAt.toLocaleString('ru-RU') : '—'}</p>
              <p><strong>Время окончания:</strong> {endAt ? endAt.toLocaleString('ru-RU') : '—'}</p>
              
              <div style={{ marginTop: 15 }}>
                <button 
                  className={styles.button} 
                  onClick={connectToClass} 
                  disabled={!isStarted || isEnded}
                  title={!isStarted ? 'Занятие еще не началось' : isEnded ? 'Занятие уже закончилось' : 'Присоединиться к занятию'}
                >
                  Присоединиться к занятию
                </button>
              </div>
            </div>

            <div className={styles.requestDetails} style={{ marginTop: 15 }}>
              <h4>Управление заданиями</h4>
              <p><strong>Привязанные задания:</strong> {selectedClass.tasks?.length || 0}</p>
              <div className={styles.requestActions}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => {
                    setShowTasksModal(true);
                    setActionError('');
                    setActionSuccess('');
                  }}
                >
                  Назначить задания
                </button>
              </div>
              {selectedClass.tasks && selectedClass.tasks.length > 0 && (
                <ul style={{ marginTop: 10 }}>
                  {selectedClass.tasks.map(task => (
                    <li key={task.id}>
                      Задание #{task.id}: {task.condition.substring(0, 50)}...
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.requestDetails} style={{ marginTop: 15 }}>
              <h4>Разбиение на команды</h4>
              {loadingTeams ? (
                <p>Загрузка...</p>
              ) : (
                <p><strong>Команд:</strong> {teams.length}</p>
              )}
              <div className={styles.requestActions}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => {
                    setShowTeamsModal(true);
                    setMovingStudent(null);
                    setSelectedTargetTeamId(0);
                    setActionError('');
                    setActionSuccess('');
                  }}
                >
                  Посмотреть разбиение на команды
                </button>
              </div>
            </div>

            <div className={styles.requestDetails} style={{ marginTop: 15 }}>
              <h4>Заявки на смену команды</h4>
              {loadingRequests ? (
                <p>Загрузка...</p>
              ) : (
                <p><strong>Заявок:</strong> {teamChangeRequests.length}</p>
              )}
              <div className={styles.requestActions}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => setShowTeamChangeRequestsModal(true)}
                >
                  Посмотреть заявки
                </button>
              </div>
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
                  setMovingStudent(null);
                  setSelectedTargetTeamId(0);
                  setActionError('');
                  setActionSuccess('');
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
            <h3>Разбиение по командам</h3>
            {actionError && <div className={styles.error}>{actionError}</div>}
            {actionSuccess && <div className={styles.info}>{actionSuccess}</div>}
            
            {movingStudent ? (
              <div>
                <p>Переместить студента <strong>{movingStudent.fullName}</strong> в команду:</p>
                <div className={styles.formGroup}>
                  <label>Выберите команду:</label>
                  <select
                    value={selectedTargetTeamId}
                    onChange={(e) => setSelectedTargetTeamId(Number(e.target.value) || 0)}
                  >
                    <option value={0}>Выберите команду</option>
                    {teams
                      .filter(t => t.teamId !== movingStudent.currentTeamId)
                      .map(t => (
                        <option key={t.teamId} value={t.teamId}>
                          Команда #{t.teamId}
                        </option>
                      ))}
                  </select>
                </div>
                <div className={styles.modalActions}>
                  <button 
                    className={styles.button} 
                    onClick={handleMoveStudent}
                    disabled={!selectedTargetTeamId}
                  >
                    Переместить
                  </button>
                  <button 
                    className={styles.buttonSecondary} 
                    onClick={() => {
                      setMovingStudent(null);
                      setSelectedTargetTeamId(0);
                      setActionError('');
                      setActionSuccess('');
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <>
                {loadingTeams ? (
                  <div className={styles.loading}>Загрузка...</div>
                ) : (
                  <div className={styles.requestsList}>
                    {(teams || []).map(t => (
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
                                <li key={m.userRoleId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                  <span>{m.fullName} (@{m.username})</span>
                                  <button
                                    className={styles.buttonSecondary}
                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                    onClick={() => {
                                      setMovingStudent({
                                        userRoleId: m.userRoleId,
                                        currentTeamId: t.teamId,
                                        fullName: m.fullName,
                                      });
                                      setSelectedTargetTeamId(0);
                                      setActionError('');
                                      setActionSuccess('');
                                    }}
                                  >
                                    Переместить
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>—</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.modalActions}>
                  <button className={styles.buttonSecondary} onClick={() => {
                    setShowTeamsModal(false);
                    setMovingStudent(null);
                    setSelectedTargetTeamId(0);
                    setActionError('');
                    setActionSuccess('');
                  }}>Закрыть</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showTeamChangeRequestsModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Заявки на смену команды</h3>
            {loadingRequests ? (
              <div className={styles.loading}>Загрузка...</div>
            ) : (
              <div className={styles.requestsList}>
                {teamChangeRequests.length === 0 ? (
                  <p>Нет заявок</p>
                ) : (
                  teamChangeRequests.map(r => (
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
                          <button className={styles.button} onClick={() => processTeamChangeRequest(r.id, true)}>
                            Одобрить
                          </button>
                          <button className={styles.buttonDanger} onClick={() => processTeamChangeRequest(r.id, false)}>
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
            <h3>Управление заданиями для класса #{selectedClass.id}</h3>
            
            {actionError && <div className={styles.error}>{actionError}</div>}
            {actionSuccess && <div className={styles.info}>{actionSuccess}</div>}

            <div style={{ marginBottom: 15 }}>
              <h4>Привязанные задания ({selectedClass.tasks?.length || 0}):</h4>
              {selectedClass.tasks && selectedClass.tasks.length > 0 ? (
                <div className={styles.requestsList}>
                  {selectedClass.tasks.map((task) => (
                    <div key={task.id} className={styles.requestCard}>
                      <div className={styles.requestDetails}>
                        <p><strong>Задание #{task.id}</strong></p>
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
                <p>Нет привязанных заданий</p>
              )}
            </div>

            <div>
              <h4>Добавить задание:</h4>
              {loadingTasks ? (
                <p>Загрузка заданий...</p>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label>Выберите задание:</label>
                    <select
                      value={selectedTaskId || ''}
                      onChange={(e) => setSelectedTaskId(Number(e.target.value) || null)}
                    >
                      <option value="">Выберите задание</option>
                      {availableTasks
                        .filter(
                          (task) =>
                            !selectedClass.tasks?.some((t) => t.id === task.id)
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
                </>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.buttonSecondary} onClick={() => {
                setShowTasksModal(false);
                setSelectedTaskId(null);
                setActionError('');
                setActionSuccess('');
              }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuratorGroupClasses;
