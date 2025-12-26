import React from 'react';

const TaskList = ({ tasks, selectedTask, onSelectTask }) => {
  return (
    <div>
      <h3>Задания</h3>
      <div style={{ marginTop: '10px' }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onSelectTask(task)}
            style={{
              padding: '10px',
              marginBottom: '5px',
              backgroundColor: selectedTask?.id === task.id ? '#e7f3ff' : 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <strong>Задача #{task.id}</strong>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              {task.condition?.substring(0, 50)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;

