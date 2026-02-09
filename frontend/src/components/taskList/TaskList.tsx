import React, { useCallback } from 'react';
import { Task } from '../../types';
import styles from './TaskList.module.scss';

interface TaskListProps {
  tasks: Task[];
  selectedTask: Task | null;
  selectedTaskForTeam: Task | null;
  isElder: boolean;
  onSelectTask: (task: Task) => void;
  onSelectTaskForTeam: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  selectedTask, 
  selectedTaskForTeam,
  isElder,
  onSelectTask, 
  onSelectTaskForTeam 
}) => {
  const handleTaskClick = useCallback((task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectTask(task);
  }, [onSelectTask]);

  const handleSelectForTeam = useCallback((task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectTaskForTeam(task);
  }, [onSelectTaskForTeam]);

  return (
    <div>
      <h3>Задания</h3>
      <div className={styles.container}>
        {tasks.map((task) => {
          const isSelected = selectedTask?.id === task.id;
          const isSelectedForTeam = selectedTaskForTeam?.id === task.id;
          
          return (
            <div
              key={task.id}
              className={`${styles.taskItem} ${isSelected ? styles.selected : ''} ${isSelectedForTeam ? styles.selectedForTeam : ''}`}
            >
              <div 
                className={styles.taskContent}
                onClick={(e) => handleTaskClick(task, e)}
              >
                <div className={styles.taskHeader}>
                  <strong>Задача #{task.id}</strong>
                  {isSelectedForTeam && (
                    <span className={styles.selectedBadge}>Выбрана для решения</span>
                  )}
                </div>
                <div className={styles.taskDescription}>
                  {task.condition?.substring(0, 50)}...
                </div>
              </div>
              {isElder && (
                <button
                  className={`${styles.selectButton} ${isSelectedForTeam ? styles.selectedButton : ''}`}
                  onClick={(e) => handleSelectForTeam(task, e)}
                  disabled={isSelectedForTeam}
                >
                  {isSelectedForTeam ? 'Выбрана' : 'Выбрать для решения'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskList;

