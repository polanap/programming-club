import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { classAPI, transferRequestAPI } from '../services/api';

const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const classesRes = await classAPI.getAll();
      setClasses(classesRes.data);
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
        <h2>Панель ученика</h2>
        
        <div className="dashboard-grid">
          <div className="dashboard-card" onClick={() => navigate('/student/classes')}>
            <h3>Занятия</h3>
            <p>Доступных занятий: {classes.length}</p>
          </div>
          
          <div className="dashboard-card" onClick={() => navigate('/student/transfer-request')}>
            <h3>Заявка на перевод</h3>
            <p>Подать заявку на перевод в другую группу</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

