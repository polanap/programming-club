import React, { useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { RoleEnum } from '../../types';
import styles from './Header.module.scss';
import '../../App.css';

const Header: React.FC = () => {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  if (!authContext) {
    throw new Error('AuthContext must be used within AuthProvider');
  }

  const { user, logout } = authContext;

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const getRoleName = useCallback((role: RoleEnum): string => {
    const roleNames: Record<string, string> = {
      MANAGER: 'Менеджер',
      CURATOR: 'Куратор',
      STUDENT: 'Ученик',
    };
    return roleNames[role] || role;
  }, []);

  return (
    <div className={styles.header}>
      <h1>Программистский клуб</h1>
      <div className={styles.headerActions}>
        {user && (
          <>
            <span>
              {user.username} ({user.roles.map(getRoleName).join(', ')})
            </span>
            <button onClick={handleLogout}>Выход</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;

