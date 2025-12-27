import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8181/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors - only redirect if not on login/register pages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Only redirect if not on login or register pages
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        // On login/register pages, just clear tokens but don't redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    // Don't redirect on 403 errors - let the component handle it
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  register: (userData) =>
    api.post('/auth/register', userData),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
};

export const groupAPI = {
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  create: (group) => api.post('/groups', group),
  update: (id, group) => api.put(`/groups/${id}`, group),
  delete: (id) => api.delete(`/groups/${id}`),
};

export const taskAPI = {
  getAll: () => api.get('/tasks'),
  getById: (id) => api.get(`/tasks/${id}`),
  getByAuthor: (authorId) => api.get(`/tasks/author/${authorId}`),
  getOpen: () => api.get('/tasks/open'),
  create: (task) => api.post('/tasks', task),
  update: (id, task) => api.put(`/tasks/${id}`, task),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const classAPI = {
  getAll: () => api.get('/classes'),
  getById: (id) => api.get(`/classes/${id}`),
  getBySchedule: (scheduleId) => api.get(`/classes/schedule/${scheduleId}`),
};

export const teamAPI = {
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  getByClass: (classId) => api.get(`/teams/class/${classId}`),
};

export const scheduleAPI = {
  getAll: () => api.get('/schedules'),
  getById: (id) => api.get(`/schedules/${id}`),
  getByGroup: (groupId) => api.get(`/schedules/group/${groupId}`),
  getRelevantByGroup: (groupId) => api.get(`/schedules/group/${groupId}/relevant`),
  create: (schedule) => api.post('/schedules', schedule),
  update: (id, schedule) => api.put(`/schedules/${id}`, schedule),
};

export const transferRequestAPI = {
  getAll: () => api.get('/transfer-requests'),
  getById: (id) => api.get(`/transfer-requests/${id}`),
  getByStudent: (studentId) => api.get(`/transfer-requests/student/${studentId}`),
  getByManager: (managerId) => api.get(`/transfer-requests/manager/${managerId}`),
  create: (request) => api.post('/transfer-requests', request),
  update: (id, request) => api.put(`/transfer-requests/${id}`, request),
};

export const teamChangeRequestAPI = {
  getAll: () => api.get('/team-change-requests'),
  getById: (id) => api.get(`/team-change-requests/${id}`),
  create: (request) => api.post('/team-change-requests', request),
  update: (id, request) => api.put(`/team-change-requests/${id}`, request),
};

export const elderChangeRequestAPI = {
  getAll: () => api.get('/elder-change-requests'),
  getById: (id) => api.get(`/elder-change-requests/${id}`),
  create: (request) => api.post('/elder-change-requests', request),
  update: (id, request) => api.put(`/elder-change-requests/${id}`, request),
};

export const managerAPI = {
  getInactive: (page = 0, size = 10) => 
    api.get('/managers/inactive', { params: { page, size } }),
  activate: (userId) => api.post(`/managers/${userId}/activate`),
};

export default api;

