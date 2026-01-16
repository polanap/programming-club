import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/header/Header';
import { taskAPI, groupAPI } from '../../../services/api';
import { Task, Group, AuthUser } from '../../../types';
import styles from './CuratorDashboard.module.scss';

const CuratorDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user: AuthUser = JSON.parse(userStr);
      const [tasksRes, groupsRes] = await Promise.all([
        taskAPI.getByAuthor(user.id).catch(() => ({ data: [] })),
        groupAPI.getMyCuratorGroups().catch(() => ({ data: [] })),
      ]);
      setTasks(tasksRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      <div className="dashboard">
        <h2>Панель куратора</h2>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardCard} onClick={() => navigate('/curator/tasks')}>
            <h3>Управление заданиями</h3>
            <p>Мои задания: {tasks.length}</p>
            <p>Создание, редактирование и привязка заданий к классам</p>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/curator/classes')}>
            <h3>Мои классы</h3>
            <p>Просмотр и редактирование классов</p>
            <p>Привязка заданий к классам</p>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/curator/groups')}>
            <h3>Группы</h3>
            <p>Всего групп: {groups.length}</p>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/curator/team-change-requests')}>
            <h3>Заявки на смену команды</h3>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/curator/transfer-requests')}>
            <h3>Заявки на разъяснение перевода</h3>
            <p>Разъяснение причин перевода учеников</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuratorDashboard;

