import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/header/Header';
import { classAPI, scheduleAPI, teamAPI, teamChangeRequestAPI, elderChangeRequestAPI } from '../../services/api';
import { AuthUser, ClassResponseDTO, Schedule, TeamResponseDTO } from '../../types';
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

const StudentGroupClasses: React.FC = () => {
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

  const [showTeamsModal, setShowTeamsModal] = useState<boolean>(false);
  const [showTeamChangeModal, setShowTeamChangeModal] = useState<boolean>(false);
  const [showElderChangeModal, setShowElderChangeModal] = useState<boolean>(false);
  const [teamChangeComment, setTeamChangeComment] = useState<string>('');
  const [elderChangeComment, setElderChangeComment] = useState<string>('');
  const [selectedToTeamId, setSelectedToTeamId] = useState<number>(0);
  const [selectedNewElderUserRoleId, setSelectedNewElderUserRoleId] = useState<number>(0);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  const userStr = localStorage.getItem('user');
  const user: AuthUser | null = userStr ? JSON.parse(userStr) : null;

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

  const myTeam = useMemo(() => {
    if (!user?.id) return null;
    const list = Array.isArray(teams) ? teams : [];
    return list.find(t =>
      (t.elder?.userId === user.id) ||
      (Array.isArray(t.members) && t.members.some(m => m.userId === user.id))
    ) || null;
  }, [teams, user?.id]);

  const otherTeams = useMemo(() => {
    const list = Array.isArray(teams) ? teams : [];
    return myTeam ? list.filter(t => t.teamId !== myTeam.teamId) : list;
  }, [teams, myTeam]);

  const myTeamMembersForElder = useMemo(() => {
    if (!myTeam) return [];
    // allow selecting among members; include elder too if needed, but usually choose someone else
    return Array.isArray(myTeam.members) ? myTeam.members : [];
  }, [myTeam]);

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

  const openLessonMenu = async (c: ClassWithSchedule) => {
    setSelectedClass(c);
    setShowLessonMenu(true);
    setActionError('');
    setActionSuccess('');
    setTeams([]);
    setSelectedToTeamId(0);
    setSelectedNewElderUserRoleId(0);
    setTeamChangeComment('');
    setElderChangeComment('');
    if (c?.id) {
      await loadTeamsForClass(c.id);
    }
  };

  const submitTeamChange = async () => {
    if (!selectedClass?.id) return;
    if (!selectedToTeamId) {
      setActionError('Выберите команду');
      return;
    }
    try {
      setActionError('');
      await teamChangeRequestAPI.create({
        toTeamId: selectedToTeamId,
        comment: teamChangeComment.trim() ? teamChangeComment.trim() : undefined,
      });
      setActionSuccess('Заявка на смену команды отправлена');
      setShowTeamChangeModal(false);
    } catch (err: any) {
      setActionError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка отправки заявки');
    }
  };

  const submitElderChange = async () => {
    if (!selectedClass?.id) return;
    if (!selectedNewElderUserRoleId) {
      setActionError('Выберите нового старосту');
      return;
    }
    try {
      setActionError('');
      await elderChangeRequestAPI.create({
        newElderId: selectedNewElderUserRoleId,
        comment: elderChangeComment.trim() ? elderChangeComment.trim() : undefined,
      });
      setActionSuccess('Заявка на смену старосты отправлена');
      setShowElderChangeModal(false);
    } catch (err: any) {
      setActionError(err.response?.data?.errorMessage || err.response?.data?.message || 'Ошибка отправки заявки');
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
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.buttonSecondary} onClick={() => navigate('/student/groups')}>Назад к группам</button>
          <button className={styles.button} onClick={load}>Обновить</button>
        </div>
      </div>

      {showLessonMenu && selectedClass && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Меню занятия #{selectedClass.id}</h3>

            {actionError && <div className={styles.error}>{actionError}</div>}
            {actionSuccess && <div className={styles.info}>{actionSuccess}</div>}
            {teamsError && <div className={styles.error}>{teamsError}</div>}

            <div className={styles.requestDetails}>
              <p><strong>Статус:</strong> {lessonStatusText}</p>
              <p><strong>Подключение:</strong></p>
              <button className={styles.button} onClick={connectToClass} disabled={!isStarted || isEnded}>
                Подключиться к занятию
              </button>
            </div>

            <div className={styles.requestDetails} style={{ marginTop: 15 }}>
              {loadingTeams ? (
                <p>Загрузка информации о команде...</p>
              ) : (
                <>
                  <p><strong>Моя команда:</strong> {myTeam ? `#${myTeam.teamId}` : 'Не назначена'}</p>
                  <p><strong>Староста:</strong> {myTeam?.elder?.fullName || '—'}</p>
                </>
              )}
              <div className={styles.requestActions}>
                <button
                  className={styles.buttonSecondary}
                  onClick={() => setShowTeamsModal(true)}
                >
                  Посмотреть разбиение по другим командам
                </button>
                <button
                  className={styles.button}
                  onClick={() => { setShowTeamChangeModal(true); setActionError(''); setActionSuccess(''); }}

                >
                  Заявка на смену команды
                </button>
                <button
                  className={styles.button}
                  onClick={() => { setShowElderChangeModal(true); setActionError(''); setActionSuccess(''); }}

                >
                  Заявка на смену старосты
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
                  setShowTeamChangeModal(false);
                  setShowElderChangeModal(false);
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
                            <li key={m.userRoleId}>{m.fullName} (@{m.username})</li>
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
              <button className={styles.buttonSecondary} onClick={() => setShowTeamsModal(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {showTeamChangeModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Заявка на смену команды</h3>
            <div className={styles.formGroup}>
              <label>Команда, в которую хотите перейти:</label>
              <select value={selectedToTeamId} onChange={(e) => setSelectedToTeamId(parseInt(e.target.value, 10) || 0)}>
                <option value={0}>Выберите команду</option>
                {otherTeams.map(t => (
                  <option key={t.teamId} value={t.teamId}>Команда #{t.teamId}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Комментарий (опционально):</label>
              <textarea value={teamChangeComment} onChange={(e) => setTeamChangeComment(e.target.value)} rows={4} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.button} onClick={submitTeamChange} disabled={!selectedToTeamId}>Отправить</button>
              <button className={styles.buttonSecondary} onClick={() => setShowTeamChangeModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {showElderChangeModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Заявка на смену старосты</h3>
            <div className={styles.formGroup}>
              <label>Новый староста (из вашей команды):</label>
              <select
                value={selectedNewElderUserRoleId}
                onChange={(e) => setSelectedNewElderUserRoleId(parseInt(e.target.value, 10) || 0)}
              >
                <option value={0}>Выберите участника</option>
                {myTeamMembersForElder.map(m => (
                  <option key={m.userRoleId} value={m.userRoleId}>
                    {m.fullName} (@{m.username})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Комментарий (опционально):</label>
              <textarea value={elderChangeComment} onChange={(e) => setElderChangeComment(e.target.value)} rows={4} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.button} onClick={submitElderChange} disabled={!selectedNewElderUserRoleId}>Отправить</button>
              <button className={styles.buttonSecondary} onClick={() => setShowElderChangeModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGroupClasses;

