import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/header/Header';
import { groupAPI, userAPI, transferRequestAPI } from '../../../services/api';
import { Group, User } from '../../../types';
import { AuthUser } from '../../../types';
import styles from './ManagerDashboard.module.scss';

interface TransferRequest {
  id: number;
  status: string;
}

const ManagerDashboard: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const user: AuthUser = JSON.parse(userStr);
      const [groupsRes, usersRes, requestsRes] = await Promise.all([
        groupAPI.getMyGroups(),
        userAPI.getAll(),
        transferRequestAPI.getByManager(user.id).catch(() => ({ data: [] })),
      ]);
      setGroups(groupsRes.data);
      setUsers(usersRes.data);
      setTransferRequests(requestsRes.data || []);
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
        <h2>Панель менеджера</h2>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardCard} onClick={() => navigate('/manager/groups')}>
            <h3>Группы</h3>
            <p>Всего групп: {groups.length}</p>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/manager/users')}>
            <h3>Пользователи</h3>
            <p>Всего пользователей: {users.length}</p>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/manager/transfer-requests')}>
            <h3>Заявки на перевод</h3>
            <p>Новых заявок: {transferRequests.filter(r => r.status === 'NEW').length}</p>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/manager/activation')}>
            <h3>Активация менеджеров</h3>
            <p>Управление аккаунтами менеджеров</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

