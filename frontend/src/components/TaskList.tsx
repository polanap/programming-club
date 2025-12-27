import React, { useCallback } from 'react';
import { Task } from '../types';
import styles from './TaskList.module.scss';

interface TaskListProps {
  tasks: Task[];
  selectedTask: Task | null;
  onSelectTask: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, selectedTask, onSelectTask }) => {
  const handleTaskClick = useCallback((task: Task) => {
    onSelectTask(task);
  }, [onSelectTask]);

  return (
    <div>
      <h3>Задания</h3>
      <div className={styles.container}>
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className={`${styles.taskItem} ${selectedTask?.id === task.id ? styles.selected : ''}`}
          >
            <strong>Задача #{task.id}</strong>
            <div className={styles.taskDescription}>
              {task.condition?.substring(0, 50)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;

