import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { groupAPI, userAPI, transferRequestAPI } from '../services/api';

const ManagerDashboard = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [transferRequests, setTransferRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsRes, usersRes, requestsRes] = await Promise.all([
        groupAPI.getAll(),
        userAPI.getAll(),
        transferRequestAPI.getByManager(JSON.parse(localStorage.getItem('user')).id),
      ]);
      setGroups(groupsRes.data);
      setUsers(usersRes.data);
      setTransferRequests(requestsRes.data || []);
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
        <h2>Панель менеджера</h2>
        
        <div className="dashboard-grid">
          <div className="dashboard-card" onClick={() => navigate('/manager/groups')}>
            <h3>Группы</h3>
            <p>Всего групп: {groups.length}</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/manager/users')}>
            <h3>Пользователи</h3>
            <p>Всего пользователей: {users.length}</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/manager/transfer-requests')}>
            <h3>Заявки на перевод</h3>
            <p>Новых заявок: {transferRequests.filter(r => r.status === 'NEW').length}</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/manager/activation')}>
            <h3>Активация менеджеров</h3>
            <p>Управление аккаунтами менеджеров</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

