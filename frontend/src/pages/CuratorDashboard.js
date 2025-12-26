import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { taskAPI, groupAPI } from '../services/api';

const CuratorDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem('user'))?.id;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, groupsRes] = await Promise.all([
        taskAPI.getByAuthor(userId),
        groupAPI.getAll(),
      ]);
      setTasks(tasksRes.data);
      setGroups(groupsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div>
      <Header />
      <div className="dashboard">
        <h2>Панель куратора</h2>
        
        <div className="dashboard-grid">
          <div className="dashboard-card" onClick={() => navigate('/curator/tasks')}>
            <h3>Задания</h3>
            <p>Мои задания: {tasks.length}</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/curator/groups')}>
            <h3>Группы</h3>
            <p>Всего групп: {groups.length}</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/curator/team-change-requests')}>
            <h3>Заявки на смену команды</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuratorDashboard;

