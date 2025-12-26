import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import CodeEditor from '../components/CodeEditor';
import TaskList from '../components/TaskList';
import HandRaiseButton from '../components/HandRaiseButton';
import { classAPI, taskAPI, teamAPI } from '../services/api';

const ClassRoom = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    try {
      const [classRes, tasksRes, teamsRes] = await Promise.all([
        classAPI.getById(classId),
        taskAPI.getAll(),
        teamAPI.getByClass(classId),
      ]);
      
      setClassData(classRes.data);
      setTasks(tasksRes.data);
      
      // Find user's team
      // This would need proper implementation based on user_team table
      if (teamsRes.data && teamsRes.data.length > 0) {
        setTeam(teamsRes.data[0]); // Simplified - should find user's actual team
      }
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  const isElder = team && team.elder?.id === user?.id;
  const isCurator = user?.roles?.includes('CURATOR');

  return (
    <div>
      <Header />
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        <div style={{ width: '300px', borderRight: '1px solid #ddd', padding: '20px' }}>
          <TaskList
            tasks={tasks}
            selectedTask={selectedTask}
            onSelectTask={setSelectedTask}
          />
          {isElder && (
            <HandRaiseButton teamId={team?.id} />
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedTask && (
            <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
              <h2>{selectedTask.condition}</h2>
            </div>
          )}
          <div style={{ flex: 1 }}>
            {team && (
              <CodeEditor
                teamId={team.id}
                taskId={selectedTask?.id}
                isElder={isElder}
                isCurator={isCurator}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassRoom;

