import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import { classAPI } from '../services/api';
import { Class } from '../types';
import styles from './StudentDashboard.module.scss';

const StudentDashboard: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const classesRes = await classAPI.getAll();
      setClasses(classesRes.data);
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
        <h2>Панель ученика</h2>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardCard} onClick={() => navigate('/student/classes')}>
            <h3>Занятия</h3>
            <p>Доступных занятий: {classes.length}</p>
          </div>
          
          <div className={styles.dashboardCard} onClick={() => navigate('/student/transfer-request')}>
            <h3>Заявка на перевод</h3>
            <p>Подать заявку на перевод в другую группу</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

