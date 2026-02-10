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
  const navigate = useNavigate();


  return (
    <div>
      <Header />
      <div className="dashboard">
        <h2>Панель менеджера</h2>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardCard} onClick={() => navigate('/manager/groups')}>
            <h3>Группы</h3>
            <p>Создание новых групп и управление группами, менеджером которых вы являетесь</p>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/manager/transfer-requests')}>
            <h3>Заявки на перевод</h3>
            <p>Заявки на перевод в другую группу</p>
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

