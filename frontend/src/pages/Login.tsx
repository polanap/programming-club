import React, { useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { RoleEnum } from '../types';
import styles from './Login.module.scss';
import '../App.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  if (!authContext) {
    throw new Error('AuthContext must be used within AuthProvider');
  }

  const { login } = authContext;

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const result = await login(username, password);
    
    if (result.success) {
      // Redirect based on user role
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.roles.includes(RoleEnum.MANAGER)) {
          navigate('/manager');
        } else if (user.roles.includes(RoleEnum.CURATOR)) {
          navigate('/curator');
        } else if (user.roles.includes(RoleEnum.STUDENT)) {
          navigate('/student');
        }
      }
    } else {
      setError(result.error || 'Invalid username or password');
    }
  }, [username, password, login, navigate]);

  return (
    <div className={`container ${styles.container}`}>
      <div className="card">
        <h2>Вход в систему</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className={styles.errorMessage}>{error}</div>}
          <button type="submit" className={`btn btn-primary ${styles.submitButton}`}>
            Войти
          </button>
        </form>
        <div className={styles.linkContainer}>
          <a href="/register">Нет аккаунта? Зарегистрироваться</a>
        </div>
      </div>
    </div>
  );
};

export default Login;

