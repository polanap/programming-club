import React, { useState, useCallback } from 'react';
import styles from './HandRaiseButton.module.scss';

interface HandRaiseButtonProps {
  teamId: number;
}

const HandRaiseButton: React.FC<HandRaiseButtonProps> = ({ teamId }) => {
  const [handRaised, setHandRaised] = useState<boolean>(false);

  const handleToggle = useCallback(() => {
    // TODO: Implement WebSocket hand raise functionality
    setHandRaised(prev => !prev);
    console.log(`Hand ${handRaised ? 'lowered' : 'raised'} for team ${teamId}`);
  }, [teamId, handRaised]);

  return (
    <div className={styles.container}>
      <button
        onClick={handleToggle}
        className={`btn ${handRaised ? 'btn-success' : 'btn-primary'} ${styles.button}`}
      >
        {handRaised ? '✋ Рука поднята' : '✋ Поднять руку'}
      </button>
    </div>
  );
};

export default HandRaiseButton;

