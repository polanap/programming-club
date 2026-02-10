import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Header from '../../components/header/Header';
import CodeEditor from '../../components/codeEditor/CodeEditor';
import TaskList from '../../components/taskList/TaskList';
import HandRaiseButton from '../../components/handRiseButton/HandRaiseButton';
import EventLog from '../../components/eventLog/EventLog';
import { classAPI, taskAPI, teamAPI, classSessionAPI } from '../../services/api';
import { Class, Task, Team, TeamResponseDTO, AuthUser, RoleEnum, EventDTO } from '../../types';
import styles from './ClassRoom.module.scss';

const ClassRoom: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskForTeam, setSelectedTaskForTeam] = useState<Task | null>(null); 
  const [elderCode, setElderCode] = useState<string>(''); 
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
  
  // WebSocket connection for team events
  const stompClientRef = useRef<Client | null>(null);
  const subscribedTeamIdsRef = useRef<Set<number>>(new Set());
  const isConnectingRef = useRef<boolean>(false);
  
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
        
        // Load initial team status and curators for students
        if (isStudent && myTeam) {
          try {
            // Load team status
            const statusRes = await classSessionAPI.getTeamStatus(myTeam.teamId);
            setTeamStatus(statusRes.data);
            
            // Load joined curators
            const curatorsRes = await classSessionAPI.getJoinedCurators(myTeam.teamId);
            setJoinedCurators(Array.isArray(curatorsRes.data) ? curatorsRes.data : []);
            
            // Load tasks
            const tasksRes = await classAPI.getTasks(parseInt(classId));
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
            setTasks(tasksData);
            
            // Set selected task if there's one in status
            if (statusRes.data.selectedTaskId) {
              const task = tasksData.find((t: Task) => t.id === statusRes.data.selectedTaskId);
              if (task) {
                setSelectedTaskForTeam(task);
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
          
          // If joined to a team, load initial team status, curators and tasks
          if (joinedTeamId) {
            try {
              // Load initial team status
              const statusRes = await classSessionAPI.getTeamStatus(joinedTeamId);
              setTeamStatus(statusRes.data);
              
              // Load joined curators
              const curatorsRes = await classSessionAPI.getJoinedCurators(joinedTeamId);
              setJoinedCurators(Array.isArray(curatorsRes.data) ? curatorsRes.data : []);
              
              // Load tasks
              const tasksRes = await classAPI.getTasks(parseInt(classId));
              const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
              setTasks(tasksData);
              
              // Set selected task if there's one in status
              if (statusRes.data.selectedTaskId) {
                const task = tasksData.find((t: Task) => t.id === statusRes.data.selectedTaskId);
                if (task) {
                  setSelectedTaskForTeam(task);
                  if (!selectedTask) {
                    setSelectedTask(task);
                  }
                }
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
      // Status will be updated via WebSocket event
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
      // Get solution from elder's code area
      await classSessionAPI.submitSolution(team.id, selectedTaskForTeam.id, elderCode);
      alert('Решение отправлено на проверку');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Ошибка при отправке решения';
      alert(errorMsg);
    }
  }, [team, selectedTaskForTeam, elderCode]);

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
    // Load initial statuses for all teams - check if current curator is joined
    if (!isCurator || allTeams.length === 0) return;
    
    const statusPromises = allTeams.map(async (team) => {
      try {
        const joinedRes = await classSessionAPI.isCuratorJoined(team.teamId);
        return {
          teamId: team.teamId,
          isCuratorJoined: joinedRes.data.isJoined,
        };
      } catch (err) {
        console.error(`Error checking curator join status for team ${team.teamId}:`, err);
        return {
          teamId: team.teamId,
          isCuratorJoined: false,
        };
      }
    });
    
    const statuses = await Promise.all(statusPromises);
    const statusMap: Record<number, { isBlocked: boolean; isCuratorJoined: boolean; loading: boolean }> = {};
    statuses.forEach(({ teamId, isCuratorJoined }) => {
      statusMap[teamId] = { 
        isBlocked: false, 
        isCuratorJoined, 
        loading: false 
      };
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
      // Status will be updated via WebSocket event
      setTeamStatuses(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], loading: false }
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
        // Update isCuratorJoined status immediately when leaving
        setTeamStatuses(prev => ({
          ...prev,
          [teamId]: { 
            ...(prev[teamId] || { isBlocked: false, isCuratorJoined: false, loading: false }),
            isCuratorJoined: false,
            loading: false
          }
        }));
      } else {
        await classSessionAPI.joinTeam(teamId);
        setCuratorJoinedTeamId(teamId);
        
        // Update isCuratorJoined status immediately when joining
        setTeamStatuses(prev => ({
          ...prev,
          [teamId]: { 
            ...(prev[teamId] || { isBlocked: false, isCuratorJoined: false, loading: false }),
            isCuratorJoined: true,
            loading: false
          }
        }));
        
        // Load initial team status, curators and tasks when joining
        if (classId) {
          try {
            // Load initial team status
            const statusRes = await classSessionAPI.getTeamStatus(teamId);
            setTeamStatus(statusRes.data);
            
            // Load joined curators
            const curatorsRes = await classSessionAPI.getJoinedCurators(teamId);
            setJoinedCurators(Array.isArray(curatorsRes.data) ? curatorsRes.data : []);
            
            // Load tasks
            const tasksRes = await classAPI.getTasks(parseInt(classId));
            const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
            setTasks(tasksData);
            
            // Set selected task if there's one in status
            if (statusRes.data.selectedTaskId) {
              const task = tasksData.find((t: Task) => t.id === statusRes.data.selectedTaskId);
              if (task) {
                setSelectedTaskForTeam(task);
                if (!selectedTask) {
                  setSelectedTask(task);
                }
              }
            }
          } catch (err: any) {
            console.error('Error loading team data after join:', err);
          }
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при присоединении/отсоединении от команды');
      setTeamStatuses(prev => ({
        ...prev,
        [teamId]: { ...prev[teamId], loading: false }
      }));
    }
  }, [teamStatuses, classId]);

  // loadJoinedCurators removed - curators list will be updated via WebSocket events

  // Handle team events from WebSocket
  const handleTeamEvent = useCallback((event: EventDTO) => {
    if (!event.teamId) return;
    
    switch (event.type) {
      case 'CURATOR_BLOCKED_TEAM':
      case 'CURATOR_UNBLOCKED_TEAM':
        // Update team status blocked state
        if (event.teamId === team?.id) {
          setTeamStatus(prev => prev ? { ...prev, isBlocked: event.type === 'CURATOR_BLOCKED_TEAM' } : null);
        }
        // Update teamStatuses for curator view
        setTeamStatuses(prev => ({
          ...prev,
          [event.teamId!]: {
            ...(prev[event.teamId!] || { isBlocked: false, isCuratorJoined: false, loading: false }),
            isBlocked: event.type === 'CURATOR_BLOCKED_TEAM',
          }
        }));
        break;
        
      case 'TEAM_RAISED_HAND':
      case 'TEAM_LOWERED_HAND':
        // Update team status hand raised state
        if (event.teamId === team?.id) {
          setTeamStatus(prev => prev ? { ...prev, handRaised: event.type === 'TEAM_RAISED_HAND' } : null);
        }
        break;
        
      case 'TEAM_BEGAN_TO_COMPLETE_TASK':
        // Update selected task
        if (event.teamId === team?.id && event.taskId) {
          const task = tasks.find((t: Task) => t.id === event.taskId);
          if (task) {
            setSelectedTaskForTeam(task);
            setTeamStatus(prev => prev ? { ...prev, selectedTaskId: event.taskId } : null);
          }
        }
        break;
        
      case 'CURATOR_JOINED_TEAM':
        // Add curator to joined list
        if (event.teamId === team?.id && event.userRoleId) {
          setJoinedCurators(prev => {
            if (!prev.includes(event.userRoleId!)) {
              return [...prev, event.userRoleId!];
            }
            return prev;
          });
        }
        // Update teamStatuses - check if current user is the curator who joined
        if (event.userRoleId) {
          // We need to check if this is the current curator - this will be handled by checking userRoleId
          // For now, we'll update based on events, but curator's own status needs special handling
          setTeamStatuses(prev => {
            const currentStatus = prev[event.teamId!] || { isBlocked: false, isCuratorJoined: false, loading: false };
            return {
              ...prev,
              [event.teamId!]: {
                ...currentStatus,
                // Note: isCuratorJoined for current user will be updated when we receive their own join event
              }
            };
          });
        }
        break;
        
      case 'CURATOR_LEFT_TEAM':
        // Remove curator from joined list
        if (event.teamId === team?.id && event.userRoleId) {
          setJoinedCurators(prev => prev.filter(id => id !== event.userRoleId));
        }
        // Update teamStatuses - check if current user is the curator who left
        if (event.userRoleId) {
          setTeamStatuses(prev => {
            const currentStatus = prev[event.teamId!] || { isBlocked: false, isCuratorJoined: false, loading: false };
            return {
              ...prev,
              [event.teamId!]: {
                ...currentStatus,
                // Note: isCuratorJoined for current user will be updated when we receive their own leave event
              }
            };
          });
        }
        break;
    }
  }, [team, tasks]);
  
  // Unified WebSocket connection for team events
  useEffect(() => {
    if (!user) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Collect teams to subscribe to
    const teamsToSubscribe: number[] = [];
    if (team?.id) {
      teamsToSubscribe.push(team.id);
    }
    if (isCurator && allTeams.length > 0) {
      allTeams.forEach(teamItem => {
        if (!teamsToSubscribe.includes(teamItem.teamId)) {
          teamsToSubscribe.push(teamItem.teamId);
        }
      });
    }
    
    if (teamsToSubscribe.length === 0) return;
    
    // Prevent multiple connection attempts
    if (isConnectingRef.current) {
      console.log('WebSocket connection already in progress, skipping...');
      return;
    }
    
    // Initialize WebSocket connection if not already connected
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      isConnectingRef.current = true;
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
          console.log('WebSocket connected for team events');
          isConnectingRef.current = false;
          
          // Subscribe to all relevant teams
          teamsToSubscribe.forEach(teamId => {
            if (!subscribedTeamIdsRef.current.has(teamId)) {
              const topic = `/topic/team/${teamId}/events`;
              client.subscribe(topic, (message: IMessage) => {
                try {
                  const event: EventDTO = JSON.parse(message.body);
                  console.log('Received team event:', event);
                  handleTeamEvent(event);
                } catch (err) {
                  console.error('Error parsing team event:', err);
                }
              });
              subscribedTeamIdsRef.current.add(teamId);
              console.log('Subscribed to team events:', topic);
            }
          });
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame);
          isConnectingRef.current = false;
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
          isConnectingRef.current = false;
        },
        onWebSocketClose: () => {
          console.log('WebSocket closed');
          isConnectingRef.current = false;
        },
      });
      
      client.activate();
      stompClientRef.current = client;
    } else {
      // Already connected, subscribe to new teams
      teamsToSubscribe.forEach(teamId => {
        if (!subscribedTeamIdsRef.current.has(teamId)) {
          const topic = `/topic/team/${teamId}/events`;
          stompClientRef.current?.subscribe(topic, (message: IMessage) => {
            try {
              const event: EventDTO = JSON.parse(message.body);
              console.log('Received team event:', event);
              handleTeamEvent(event);
            } catch (err) {
              console.error('Error parsing team event:', err);
            }
          });
          subscribedTeamIdsRef.current.add(teamId);
          console.log('Subscribed to team events:', topic);
        }
      });
    }
    
    // Initial load of team status and curators (only for student's team)
    if (team?.id && isStudent) {
      // Initial status will be set via WebSocket events
      // No need to load via API
    }
    
    return () => {
      // Don't cleanup on dependency changes, only on unmount
      // Cleanup will be handled by component unmount
    };
  }, [team?.id, isCurator, allTeams, user, handleTeamEvent, isStudent, tasks]);
  
  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        console.log('Cleaning up WebSocket connection');
        stompClientRef.current.deactivate().catch(() => {});
        stompClientRef.current = null;
        subscribedTeamIdsRef.current.clear();
      }
    };
  }, []);

  // Check if curator is joined to any team on mount
  useEffect(() => {
    if (isCurator && allTeams.length > 0) {
      const checkCuratorJoined = async () => {
        for (const teamItem of allTeams) {
          try {
            const res = await classSessionAPI.isCuratorJoined(teamItem.teamId);
            // Update teamStatuses to reflect current curator's join status
            setTeamStatuses(prev => ({
              ...prev,
              [teamItem.teamId]: {
                ...(prev[teamItem.teamId] || { isBlocked: false, isCuratorJoined: false, loading: false }),
                isCuratorJoined: res.data.isJoined,
              }
            }));
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
                    // Status will be updated via WebSocket event
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
                onCodeChange={setElderCode}
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
