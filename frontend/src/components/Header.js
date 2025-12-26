import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../App.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = (role) => {
    const roleNames = {
      MANAGER: 'Менеджер',
      CURATOR: 'Куратор',
      STUDENT: 'Ученик',
    };
    return roleNames[role] || role;
  };

  return (
    <div className="header">
      <h1>Программистский клуб</h1>
      <div className="header-actions">
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

