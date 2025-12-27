import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import CodeEditor from '../components/CodeEditor';
import TaskList from '../components/TaskList';
import HandRaiseButton from '../components/HandRaiseButton';
import { classAPI, taskAPI, teamAPI } from '../services/api';
import { Class, Task, Team, AuthUser, RoleEnum } from '../types';
import styles from './ClassRoom.module.scss';

const ClassRoom: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const userStr = localStorage.getItem('user');
  const user: AuthUser | null = userStr ? JSON.parse(userStr) : null;

  const loadClassData = useCallback(async () => {
    if (!classId) return;

    try {
      const [tasksRes, teamsRes] = await Promise.all([
        taskAPI.getAll(),
        teamAPI.getByClass(parseInt(classId)),
      ]);
      
      setTasks(tasksRes.data || []);
      
      // Find user's team
      // This would need proper implementation based on user_team table
      if (teamsRes.data && teamsRes.data.length > 0) {
        setTeam(teamsRes.data[0] as Team); // Simplified - should find user's actual team
      }
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadClassData();
  }, [loadClassData]);

  const handleSelectTask = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  if (loading) {
    return (
      <div>
        <Header />
        <div>Загрузка...</div>
      </div>
    );
  }

  const isElder = team && team.elderId === user?.id;
  const isCurator = user?.roles?.includes(RoleEnum.CURATOR);

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <TaskList
            tasks={tasks}
            selectedTask={selectedTask}
            onSelectTask={handleSelectTask}
          />
          {isElder && team && (
            <HandRaiseButton teamId={team.id} />
          )}
        </div>
        <div className={styles.content}>
          {selectedTask && (
            <div className={styles.taskHeader}>
              <h2>{selectedTask.condition}</h2>
            </div>
          )}
          <div className={styles.editorContainer}>
            {team && (
              <CodeEditor
                teamId={team.id}
                taskId={selectedTask?.id || 0}
                isElder={isElder || false}
                isCurator={isCurator || false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassRoom;

