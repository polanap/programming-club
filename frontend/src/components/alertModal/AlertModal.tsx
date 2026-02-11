import React from 'react';
import styles from './AlertModal.module.scss';

interface AlertModalProps {
  message: string;
  onClose: () => void;
  type?: 'info' | 'success' | 'error' | 'warning';
}

const AlertModal: React.FC<AlertModalProps> = ({ message, onClose, type = 'info' }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.alertIcon} ${styles[type]}`}>
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </div>
        <div className={styles.message}>{message}</div>
        <button className={styles.closeButton} onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
