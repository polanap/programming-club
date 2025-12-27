import React, { useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { RegisterRequest, RoleEnum } from '../../types';
import styles from './Register.module.scss';
import '../App.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: RoleEnum.STUDENT,
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  if (!authContext) {
    throw new Error('AuthContext must be used within AuthProvider');
  }

  const { register } = authContext;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const result = await register(formData);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Registration failed');
    }
  }, [formData, register, navigate]);

  return (
    <div className={`container ${styles.container}`}>
      <div className="card">
        <h2>Регистрация</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Полное имя:</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Имя пользователя:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Роль:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value={RoleEnum.STUDENT}>Ученик</option>
              <option value={RoleEnum.CURATOR}>Куратор</option>
              <option value={RoleEnum.MANAGER}>Менеджер</option>
            </select>
          </div>
          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && (
            <div className={styles.successMessage}>
              Регистрация успешна! Перенаправление на страницу входа...
            </div>
          )}
          <button type="submit" className={`btn btn-primary ${styles.submitButton}`}>
            Зарегистрироваться
          </button>
        </form>
        <div className={styles.linkContainer}>
          <a href="/login">Уже есть аккаунт? Войти</a>
        </div>
      </div>
    </div>
  );
};

export default Register;

