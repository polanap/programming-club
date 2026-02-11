import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/header/Header';
import { taskAPI, groupAPI } from '../../../services/api';
import { Task, Group, AuthUser } from '../../../types';
import styles from './CuratorDashboard.module.scss';

const CuratorDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Header />
      <div className="dashboard">
        <h2>Панель куратора</h2>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardCard} onClick={() => navigate('/curator/tasks')}>
            <h3>Управление заданиями</h3>
            <p>Создание, редактирование и привязка заданий к классам</p>
          </div>
          
          {/* <div className={styles.dashboardCard} onClick={() => navigate('/curator/classes')}>
            <h3>Мои классы</h3>
            <p>Просмотр и редактирование классов, привязка заданий к классам</p>
          </div> */}
          
          <div className={styles.dashboardCard} onClick={() => navigate('/curator/groups')}>
            <h3>Группы</h3>
            <p>Просмотр и редактирование групп и классов, куратором которых вы являетесь</p>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/curator/team-change-requests')}>
            <h3>Заявки на смену команды</h3>
            <p>Заявки учеников на смену команды в рамках одного класса</p>
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

