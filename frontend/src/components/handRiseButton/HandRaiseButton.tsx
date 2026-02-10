import React, { useState, useEffect, useCallback } from 'react';
import { classSessionAPI } from '../../services/api';
import { useAlert } from '../../hooks/useAlert';
import styles from './HandRaiseButton.module.scss';

interface HandRaiseButtonProps {
  teamId: number;
}

const HandRaiseButton: React.FC<HandRaiseButtonProps> = ({ teamId }) => {
  const [handRaised, setHandRaised] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert, AlertComponent } = useAlert();

  // Load current hand status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await classSessionAPI.getTeamStatus(teamId);
        setHandRaised(res.data.handRaised);
      } catch (error) {
        console.error('Error loading hand status:', error);
      }
    };
    loadStatus();
  }, [teamId]);

  const handleToggle = useCallback(async () => {
    setLoading(true);
    try {
      await classSessionAPI.toggleHand(teamId);
      // Reload status to get updated state
      const res = await classSessionAPI.getTeamStatus(teamId);
      setHandRaised(res.data.handRaised);
    } catch (error: any) {
      console.error('Error toggling hand:', error);
      showAlert(error.response?.data?.message || 'Ошибка при изменении состояния руки', 'error');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  return (
    <div className={styles.container}>
      {AlertComponent}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`btn ${handRaised ? 'btn-success' : 'btn-primary'} ${styles.button}`}
      >
        {handRaised ? '✋ Рука поднята' : '✋ Поднять руку'}
      </button>
    </div>
  );
};

export default HandRaiseButton;
