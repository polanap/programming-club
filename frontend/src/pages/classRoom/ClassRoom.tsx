import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/header/Header';
import CodeEditor from '../../components/codeEditor/CodeEditor';
import TaskList from '../../components/taskList/TaskList';
import HandRaiseButton from '../../components/handRiseButton/HandRaiseButton';
import EventLog from '../../components/eventLog/EventLog';
import { classAPI, taskAPI, teamAPI, classSessionAPI } from '../../services/api';
import { Class, Task, Team, TeamResponseDTO, AuthUser, RoleEnum } from '../../types';
import styles from './ClassRoom.module.scss';

const ClassRoom: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); // Task being viewed (for condition display)
  const [selectedTaskForTeam, setSelectedTaskForTeam] = useState<Task | null>(null); // Task selected by elder for team (for CodeEditor)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [teamStatus, setTeamStatus] = useState<{ isBlocked: boolean; handRaised: boolean; selectedTaskId: number | null } | null>(null);
  const [joined, setJoined] = useState<boolean>(false);
  const [showEventLog, setShowEventLog] = useState<boolean>(false);
  const [allTeams, setAllTeams] = useState<TeamResponseDTO[]>([]);
  const [showTeamsModal, setShowTeamsModal] = useState<boolean>(false);
  const [teamStatuses, setTeamStatuses] = useState<Record<number, { isBlocked: boolean; isCuratorJoined: boolean; loading: boolean }>>({});
  const [curatorJoinedTeamId, setCuratorJoinedTeamId] = useState<number | null>(null);
  const [joinedCurators, setJoinedCurators] = useState<number[]>([]);
  
  const userStr = localStorage.getItem('user');
  const user: AuthUser | null = userStr ? JSON.parse(userStr) : null;
  const isCurator = user?.roles?.includes(RoleEnum.CURATOR);
  const isStudent = user?.roles?.includes(RoleEnum.STUDENT);
  const isManager = user?.roles?.includes(RoleEnum.MANAGER);

  const loadClassData = useCallback(async () => {
    if (!classId) return;

    try {
      setError('');
      
      // Load teams first to find user's team
      const teamsRes = await teamAPI.getByClass(parseInt(classId));
      const teams: TeamResponseDTO[] = Array.isArray(teamsRes.data) ? teamsRes.data : [];
      setAllTeams(teams);
      
      const myTeam = user?.id
        ? teams.find(t =>
            (t.elder?.userId === user.id) ||
            (Array.isArray(t.members) && t.members.some(m => m.userId === user.id))
          )
        : null;

      if (myTeam) {
        const teamData: Team = {
          id: myTeam.teamId,
          classId: parseInt(classId),
          elderId: myTeam.elder?.userId ?? 0,
        };
        setTeam(teamData);
        
        // Load team status
        let currentTeamStatus: { isBlocked: boolean; handRaised: boolean; selectedTaskId: number | null } | null = null;
        try {
          const statusRes = await classSessionAPI.getTeamStatus(myTeam.teamId);
          currentTeamStatus = statusRes.data;
          setTeamStatus(currentTeamStatus);
        } catch (err) {
          console.error('Error loading team status:', err);
        }
        
        // Load tasks - for students use classAPI.getTasks (validates session)
        // For curators joined to a team, also load class tasks
        if (isStudent && myTeam) {
          try {
            const tasksRes = await classAPI.getTasks(parseInt(classId));
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
            setTasks(tasksData);
            
            // Set selected task for team if there's one in status
            if (currentTeamStatus?.selectedTaskId) {
              const task = tasksData.find((t: Task) => t.id === currentTeamStatus.selectedTaskId);
              if (task) {
                setSelectedTaskForTeam(task);
                // Also set as viewed task if no task is being viewed
                if (!selectedTask) {
                  setSelectedTask(task);
                }
              }
            }
          } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Ошибка загрузки задач';
            setError(errorMsg);
            // If class is not in session, navigate back
            if (err.response?.status === 400) {
              setTimeout(() => navigate(-1), 2000);
            }
          }
        } else if (isCurator) {
          // For curators, check if they are joined to any team
          // First check if we already know curatorJoinedTeamId
          let joinedTeamId = curatorJoinedTeamId;
          
          // If not set, check all teams to see if curator is joined
          if (!joinedTeamId && teams.length > 0) {
            for (const teamItem of teams) {
              try {
                const res = await classSessionAPI.isCuratorJoined(teamItem.teamId);
                if (res.data.isJoined) {
                  joinedTeamId = teamItem.teamId;
                  setCuratorJoinedTeamId(teamItem.teamId);
                  break;
                }
              } catch (err) {
                console.error(`Error checking curator join status for team ${teamItem.teamId}:`, err);
              }
            }
          }
          
          // If joined to a team, load class tasks
          if (joinedTeamId) {
            try {
              const tasksRes = await classAPI.getTasks(parseInt(classId));
              const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
              setTasks(tasksData);
              
              // Load team status and selected task
              try {
                const statusRes = await classSessionAPI.getTeamStatus(joinedTeamId);
                setTeamStatus(statusRes.data);
                
                if (statusRes.data.selectedTaskId) {
                  const task = tasksData.find((t: Task) => t.id === statusRes.data.selectedTaskId);
                  if (task) {
                    setSelectedTaskForTeam(task);
                    if (!selectedTask) {
                      setSelectedTask(task);
                    }
                  }
                }
              } catch (err) {
                console.error('Error loading team status for curator:', err);
              }
            } catch (err: any) {
              console.error('Error loading class tasks for curator:', err);
              // Fallback to all tasks if class tasks fail
              const tasksRes = await taskAPI.getAll();
              setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
            }
          } else {
            // Curators not joined to a team can see all tasks
            const tasksRes = await taskAPI.getAll();
            setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
          }
        }
      } else {
        setTeam(null);
      }
    } catch (err: any) {
      console.error('Error loading class data:', err);
      setError(err.response?.data?.message || 'Ошибка загрузки данных занятия');
    } finally {
      setLoading(false);
    }
  }, [classId, user?.id, isStudent, isCurator, navigate, teamStatus?.selectedTaskId]);

  // Load class data on mount (without auto-joining)
  // Note: Joining happens only when user clicks "Join Class" button in StudentGroupClasses/CuratorGroupClasses
  useEffect(() => {
    loadClassData();
    // Assume user is already joined if they reached this page (they clicked the button)
    setJoined(true);
  }, [loadClassData]);

  // Cleanup: leave class on unmount (only if user was joined)
  useEffect(() => {
    return () => {
      if (joined && classId) {
        const leaveClass = async () => {
          try {
            if (isStudent) {
              await classSessionAPI.leaveAsStudent(parseInt(classId));
            } else if (isCurator) {
              await classSessionAPI.leaveAsCurator(parseInt(classId));
            }
          } catch (err) {
            console.error('Error leaving class:', err);
          }
        };
        leaveClass();
      }
    };
  }, [classId, isStudent, isCurator, joined]);

  // Handle viewing task condition (doesn't select for team)
  const handleSelectTask = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  // Handle selecting task for team (only for elder)
  const handleSelectTaskForTeam = useCallback(async (task: Task) => {
    if (!team || team.elderId !== user?.id) return;
    
    try {
      await classSessionAPI.selectTask(team.id, task.id);
      // Reload team status
      const statusRes = await classSessionAPI.getTeamStatus(team.id);
      setTeamStatus(statusRes.data);
      setSelectedTaskForTeam(task);
      // Also set as viewed task
      setSelectedTask(task);
    } catch (err: any) {
      console.error('Error selecting task:', err);
      alert(err.response?.data?.message || 'Ошибка при выборе задачи');
    }
  }, [team, user?.id]);

  const handleSubmitSolution = useCallback(async () => {
    if (!team || !selectedTaskForTeam) return;
    
    try {
      // Get solution from CodeEditor if available
      // For now, just send empty string - CodeEditor should handle this
      await classSessionAPI.submitSolution(team.id, selectedTaskForTeam.id);
      alert('Решение отправлено на проверку');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Ошибка при отправке решения';
      alert(errorMsg);
    }
  }, [team, selectedTaskForTeam]);

  const handleLeaveClass = useCallback(async () => {
    if (!classId || !joined) return;
    
    try {
      if (isStudent) {
        await classSessionAPI.leaveAsStudent(parseInt(classId));
      } else if (isCurator) {
        await classSessionAPI.leaveAsCurator(parseInt(classId));
      }
      setJoined(false);
      navigate(-1);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Ошибка при отключении от занятия';
      alert(errorMsg);
    }
  }, [classId, joined, isStudent, isCurator, navigate]);

  const loadTeamStatuses = useCallback(async () => {
    if (!isCurator || allTeams.length === 0) return;
    
    const statusPromises = allTeams.map(async (team) => {
      try {
        const [statusRes, joinedRes] = await Promise.all([
          classSessionAPI.getTeamStatus(team.teamId),
          classSessionAPI.isCuratorJoined(team.teamId)
        ]);
        return {
          teamId: team.teamId,
          status: {
            isBlocked: statusRes.data.isBlocked,
            isCuratorJoined: joinedRes.data.isJoined,
            loading: false
          }
        };
      } catch (err) {
        console.error(`Error loading status for team ${team.teamId}:`, err);
        return {
          teamId: team.teamId,
          status: { isBlocked: false, isCuratorJoined: false, loading: false }
        };
      }
    });
    
    const statuses = await Promise.all(statusPromises);
    const statusMap: Record<number, { isBlocked: boolean; isCuratorJoined: boolean; loading: boolean }> = {};
    statuses.forEach(({ teamId, status }) => {
      statusMap[teamId] = status;
    });
    setTeamStatuses(statusMap);
  }, [isCurator, allTeams]);

  useEffect(() => {
    if (showTeamsModal && isCurator) {
      loadTeamStatuses();
    }
  }, [showTeamsModal, isCurator, loadTeamStatuses]);

  const handleToggleTeamBlock = useCallback(async (teamId: number) => {
    const currentStatus = teamStatuses[teamId];
    const newBlocked = !currentStatus?.isBlocked;
    
    setTeamStatuses(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], loading: true }
    }));
    
    try {
      await classSessionAPI.blockTeamSubmission(teamId, newBlocked);
      const statusRes = await classSessionAPI.getTeamStatus(teamId);
      setTeamStatuses(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], isBlocked: statusRes.data.isBlocked, loading: false }
      }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при изменении статуса блокировки');
      setTeamStatuses(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], loading: false }
      }));
    }
  }, [teamStatuses]);

  const handleToggleTeamJoin = useCallback(async (teamId: number) => {
    const currentStatus = teamStatuses[teamId];
    const isJoined = currentStatus?.isCuratorJoined || false;
    
    setTeamStatuses(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], loading: true }
    }));
    
    try {
      if (isJoined) {
        await classSessionAPI.leaveTeam(teamId);
        setCuratorJoinedTeamId(null);
        // Clear tasks and selected task when leaving
        setTasks([]);
        setSelectedTask(null);
        setSelectedTaskForTeam(null);
        setTeamStatus(null);
      } else {
        await classSessionAPI.joinTeam(teamId);
        setCuratorJoinedTeamId(teamId);
        // Load tasks and team status when joining
        if (classId) {
          try {
            const tasksRes = await classAPI.getTasks(parseInt(classId));
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
            setTasks(tasksData);
            
            const statusRes = await classSessionAPI.getTeamStatus(teamId);
            setTeamStatus(statusRes.data);
            
            if (statusRes.data.selectedTaskId) {
              const task = tasksData.find((t: Task) => t.id === statusRes.data.selectedTaskId);
              if (task) {
                setSelectedTaskForTeam(task);
                setSelectedTask(task);
              }
            }
          } catch (err: any) {
            console.error('Error loading team data after join:', err);
          }
        }
      }
      const joinedRes = await classSessionAPI.isCuratorJoined(teamId);
      setTeamStatuses(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], isCuratorJoined: joinedRes.data.isJoined, loading: false }
      }));
      
      // Reload joined curators for the team (if it's the student's team)
      if (team && team.id === teamId) {
        loadJoinedCurators(teamId);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при присоединении/отсоединении от команды');
      setTeamStatuses(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], loading: false }
      }));
    }
  }, [teamStatuses, team, classId]);

  const loadJoinedCurators = useCallback(async (teamId: number) => {
    try {
      const res = await classSessionAPI.getJoinedCurators(teamId);
      setJoinedCurators(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading joined curators:', err);
      setJoinedCurators([]);
    }
  }, []);

  // Load joined curators and team status for student's team
  useEffect(() => {
    if (team && isStudent) {
      const refreshTeamData = async () => {
        try {
          // Load team status to get selected task
          const statusRes = await classSessionAPI.getTeamStatus(team.id);
          setTeamStatus(statusRes.data);
          
          // Update selected task for team if it changed
          if (statusRes.data.selectedTaskId) {
            const task = tasks.find((t: Task) => t.id === statusRes.data.selectedTaskId);
            if (task && task.id !== selectedTaskForTeam?.id) {
              setSelectedTaskForTeam(task);
            } else if (!task) {
              // Task was selected but not found in tasks list - clear selection
              setSelectedTaskForTeam(null);
            }
          } else if (selectedTaskForTeam) {
            // If no task is selected, clear selection
            setSelectedTaskForTeam(null);
          }
        } catch (err) {
          console.error('Error refreshing team status:', err);
        }
        
        // Load joined curators
        loadJoinedCurators(team.id);
      };
      
      refreshTeamData();
      // Refresh every 5 seconds to get updates
      const interval = setInterval(refreshTeamData, 5000);
      return () => clearInterval(interval);
    }
  }, [team, isStudent, tasks, selectedTask, loadJoinedCurators]);

  // Check if curator is joined to any team on mount
  useEffect(() => {
    if (isCurator && allTeams.length > 0) {
      const checkCuratorJoined = async () => {
        for (const teamItem of allTeams) {
          try {
            const res = await classSessionAPI.isCuratorJoined(teamItem.teamId);
            if (res.data.isJoined) {
              setCuratorJoinedTeamId(teamItem.teamId);
              break;
            }
          } catch (err) {
            console.error(`Error checking curator join status for team ${teamItem.teamId}:`, err);
          }
        }
      };
      checkCuratorJoined();
    }
  }, [isCurator, allTeams]);

  if (loading) {
    return (
      <div>
        <Header />
        <div>Загрузка...</div>
      </div>
    );
  }

  if (error && error.includes('не началось') || error.includes('не идет')) {
    return (
      <div>
        <Header />
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>Вернуться назад</button>
        </div>
      </div>
    );
  }

  const isElder = team && team.elderId === user?.id;

  return (
    <div>
      <Header />
      <div className={styles.container}>
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.topControls}>
          {(isCurator || isManager) && classId && (
            <>
              <button
                className={styles.eventLogButton}
                onClick={() => setShowEventLog(true)}
              >
                Посмотреть лог событий
              </button>
              {isCurator && (
                <button
                  className={styles.teamsButton}
                  onClick={() => setShowTeamsModal(true)}
                >
                  Разбиение на команды
                </button>
              )}
            </>
          )}
          {joined && (
            <button
              className={styles.leaveButton}
              onClick={handleLeaveClass}
            >
              Отключиться от занятия
            </button>
          )}
          {isElder && (
            <HandRaiseButton teamId={team.id} />
          )}
        </div>

        {showEventLog && classId && (
          <EventLog
            classId={parseInt(classId)}
            onClose={() => setShowEventLog(false)}
          />
        )}

        {showTeamsModal && isCurator && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Разбиение на команды</h3>
              <div className={styles.teamsList}>
                {allTeams.length === 0 ? (
                  <p>Команд нет</p>
                ) : (
                  allTeams.map(team => {
                    const status = teamStatuses[team.teamId] || { isBlocked: false, isCuratorJoined: false, loading: false };
                    return (
                      <div key={team.teamId} className={styles.teamCard}>
                        <div className={styles.teamHeader}>
                          <h4>Команда #{team.teamId}</h4>
                          {status.isBlocked && (
                            <span className={styles.blockedBadge}>Заблокирована</span>
                          )}
                          {status.isCuratorJoined && (
                            <span className={styles.joinedBadge}>Вы присоединены</span>
                          )}
                        </div>
                        <div className={styles.teamDetails}>
                          <p><strong>Староста:</strong> {team.elder?.fullName || '—'}</p>
                          <p><strong>Участники:</strong></p>
                          {team.members?.length ? (
                            <ul>
                              {team.members.map(m => (
                                <li key={m.userRoleId}>{m.fullName} (@{m.username})</li>
                              ))}
                            </ul>
                          ) : (
                            <p>—</p>
                          )}
                        </div>
                        <div className={styles.teamActions}>
                          <button
                            className={status.isBlocked ? styles.button : styles.buttonDanger}
                            onClick={() => handleToggleTeamBlock(team.teamId)}
                            disabled={status.loading}
                          >
                            {status.loading ? 'Загрузка...' : (status.isBlocked ? 'Разблокировать отправку' : 'Заблокировать отправку')}
                          </button>
                          <button
                            className={status.isCuratorJoined ? styles.buttonSecondary : styles.button}
                            onClick={() => handleToggleTeamJoin(team.teamId)}
                            disabled={status.loading}
                          >
                            {status.loading ? 'Загрузка...' : (status.isCuratorJoined ? 'Отсоединиться от команды' : 'Присоединиться к команде')}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className={styles.modalActions}>
                <button className={styles.buttonSecondary} onClick={() => setShowTeamsModal(false)}>Закрыть</button>
              </div>
            </div>
          </div>
        )}
        
        <div className={styles.mainContent}>
          <div className={styles.sidebar}>
          {/* Show TaskList for students or curators joined to a team */}
          {(team || (isCurator && curatorJoinedTeamId)) && (
            <TaskList
              tasks={tasks}
              selectedTask={selectedTask}
              selectedTaskForTeam={selectedTaskForTeam}
              isElder={isElder || false}
              onSelectTask={handleSelectTask}
              onSelectTaskForTeam={handleSelectTaskForTeam}
            />
          )}
          {team && (
            <>
              {joinedCurators.length > 0 && (
                <div className={styles.curatorJoinedNotification}>
                  <strong>К команде присоединился куратор</strong>
                  <p>Куратор может помочь с решением задачи</p>
                </div>
              )}
              {isElder && (
                <>
              {selectedTaskForTeam && teamStatus && !teamStatus.isBlocked && (
                <button 
                  className={styles.submitButton}
                  onClick={handleSubmitSolution}
                >
                  Отправить решение
                </button>
              )}
                  {teamStatus?.isBlocked && (
                    <div className={styles.blockedWarning}>
                      Куратор временно заблокировал вам отправку решений
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {isCurator && team && (
            <div className={styles.curatorControls}>
              <h4>Управление командой</h4>
              <button
                onClick={async () => {
                  try {
                    await classSessionAPI.blockTeamSubmission(team.id, !teamStatus?.isBlocked);
                    const statusRes = await classSessionAPI.getTeamStatus(team.id);
                    setTeamStatus(statusRes.data);
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Ошибка');
                  }
                }}
              >
                {teamStatus?.isBlocked ? 'Разблокировать' : 'Заблокировать'} отправку
              </button>
            </div>
          )}
        </div>
        <div className={styles.content}>
          {selectedTask ? (
            <div className={styles.taskHeader}>
              <h2>Задача #{selectedTask.id}</h2>
              <p className={styles.taskCondition}>{selectedTask.condition}</p>
              {selectedTaskForTeam && selectedTaskForTeam.id === selectedTask.id && (
                <div className={styles.selectedForTeamBadge}>
                  ✓ Выбрана для решения
                </div>
              )}
            </div>
          ) : (team || (isCurator && curatorJoinedTeamId)) && (isStudent || isElder || isCurator) ? (
            <div className={styles.taskHeader}>
              <p className={styles.noTaskMessage}>Выберите задачу из списка, чтобы посмотреть её условие</p>
            </div>
          ) : null}
          <div className={styles.editorContainer}>
            {/* Show CodeEditor for student's team or for curator's joined team */}
            {/* CodeEditor uses selectedTaskForTeam (task selected by elder), not selectedTask (viewed task) */}
            {(team || (isCurator && curatorJoinedTeamId)) && selectedTaskForTeam ? (
              <CodeEditor
                teamId={team?.id || curatorJoinedTeamId || 0}
                taskId={selectedTaskForTeam.id}
                isElder={isElder || false}
                isCurator={(isCurator && curatorJoinedTeamId !== null) || false}
              />
            ) : team && (isStudent || isElder) ? (
              <div className={styles.noTeamMessage}>
                Староста еще не выбрал задачу для решения
              </div>
            ) : null}
            {!team && !curatorJoinedTeamId && (
              <div className={styles.noTeamMessage}>
                {isCurator ? 'Присоединитесь к команде, чтобы видеть интерфейс ввода решения' : 'Вы не состоите в команде'}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ClassRoom;
