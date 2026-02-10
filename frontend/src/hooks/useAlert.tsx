import { useState, useCallback } from 'react';
import AlertModal from '../components/alertModal/AlertModal';

type AlertType = 'info' | 'success' | 'error' | 'warning';

interface AlertState {
  message: string;
  type: AlertType;
  isOpen: boolean;
}

export const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    message: '',
    type: 'info',
    isOpen: false,
  });

  const showAlert = useCallback((message: string, type: AlertType = 'info') => {
    setAlert({
      message,
      type,
      isOpen: true,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const AlertComponent = alert.isOpen ? (
    <AlertModal
      message={alert.message}
      onClose={closeAlert}
      type={alert.type}
    />
  ) : null;

  return {
    showAlert,
    AlertComponent,
  };
};
