import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, Group, GroupResponse, CreateScheduleRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8181/api';

const api: AxiosInstance = axios.create({
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
  login: (username: string, password: string): Promise<AxiosResponse<any>> =>
    api.post('/auth/login', { username, password }),
  register: (userData: any): Promise<AxiosResponse<any>> =>
    api.post('/auth/register', userData),
};

export const userAPI = {
  getAll: (): Promise<AxiosResponse<User[]>> => api.get('/users'),
  getById: (id: number): Promise<AxiosResponse<User>> => api.get(`/users/${id}`),
  getAllStudents: (): Promise<AxiosResponse<User[]>> => api.get('/users/students'),
  getAllCurators: (): Promise<AxiosResponse<User[]>> => api.get('/users/curators'),
  getAllManagers: (): Promise<AxiosResponse<User[]>> => api.get('/users/managers'),
};

export const groupAPI = {
  getAll: (): Promise<AxiosResponse<Group[]>> => api.get('/groups'),
  getById: (id: number): Promise<AxiosResponse<Group>> => api.get(`/groups/${id}`),
  create: (group: any): Promise<AxiosResponse<Group>> => api.post('/groups', group),
  update: (id: number, group: any): Promise<AxiosResponse<Group>> => api.put(`/groups/${id}`, group),
  delete: (id: number): Promise<AxiosResponse<void>> => api.delete(`/groups/${id}`),
  // Group management endpoints
  createGroup: (): Promise<AxiosResponse<Group>> => api.post('/groups'),
  getMyGroups: (): Promise<AxiosResponse<Group[]>> => api.get('/groups/my'),
  getGroupDetails: (groupId: number): Promise<AxiosResponse<GroupResponse>> => api.get(`/groups/${groupId}`),
  addStudent: (groupId: number, userId: number): Promise<AxiosResponse<void>> => 
    api.post(`/groups/${groupId}/students`, { userId, role: 'STUDENT' }),
  removeStudent: (groupId: number, studentUserId: number): Promise<AxiosResponse<void>> => 
    api.delete(`/groups/${groupId}/students/${studentUserId}`),
  addCurator: (groupId: number, userId: number): Promise<AxiosResponse<void>> => 
    api.post(`/groups/${groupId}/curators`, { userId, role: 'CURATOR' }),
  removeCurator: (groupId: number, curatorUserId: number): Promise<AxiosResponse<void>> => 
    api.delete(`/groups/${groupId}/curators/${curatorUserId}`),
  addManager: (groupId: number, userId: number): Promise<AxiosResponse<void>> => 
    api.post(`/groups/${groupId}/managers`, { userId, role: 'MANAGER' }),
  removeManager: (groupId: number, managerUserId: number): Promise<AxiosResponse<void>> => 
    api.delete(`/groups/${groupId}/managers/${managerUserId}`),
  createSchedule: (groupId: number, scheduleData: CreateScheduleRequest): Promise<AxiosResponse<any>> => 
    api.post(`/groups/${groupId}/schedules`, scheduleData),
  startGroup: (groupId: number): Promise<AxiosResponse<void>> => api.post(`/groups/${groupId}/start`),
  getGroupUsersByRole: (groupId: number, role: string): Promise<AxiosResponse<User[]>> => 
    api.get(`/groups/${groupId}/users/${role}`),
};

export const taskAPI = {
  getAll: (): Promise<AxiosResponse<any[]>> => api.get('/tasks'),
  getById: (id: number): Promise<AxiosResponse<any>> => api.get(`/tasks/${id}`),
  getByAuthor: (authorId: number): Promise<AxiosResponse<any[]>> => api.get(`/tasks/author/${authorId}`),
  getOpen: (): Promise<AxiosResponse<any[]>> => api.get('/tasks/open'),
  create: (task: any): Promise<AxiosResponse<any>> => api.post('/tasks', task),
  update: (id: number, task: any): Promise<AxiosResponse<any>> => api.put(`/tasks/${id}`, task),
  delete: (id: number): Promise<AxiosResponse<void>> => api.delete(`/tasks/${id}`),
};

export const classAPI = {
  getAll: (): Promise<AxiosResponse<any[]>> => api.get('/classes'),
  getById: (id: number): Promise<AxiosResponse<any>> => api.get(`/classes/${id}`),
  getBySchedule: (scheduleId: number): Promise<AxiosResponse<any[]>> => api.get(`/classes/schedule/${scheduleId}`),
};

export const teamAPI = {
  getAll: (): Promise<AxiosResponse<any[]>> => api.get('/teams'),
  getById: (id: number): Promise<AxiosResponse<any>> => api.get(`/teams/${id}`),
  getByClass: (classId: number): Promise<AxiosResponse<any[]>> => api.get(`/teams/class/${classId}`),
};

export const scheduleAPI = {
  getAll: (): Promise<AxiosResponse<any[]>> => api.get('/schedules'),
  getById: (id: number): Promise<AxiosResponse<any>> => api.get(`/schedules/${id}`),
  getByGroup: (groupId: number): Promise<AxiosResponse<any[]>> => api.get(`/schedules/group/${groupId}`),
  getRelevantByGroup: (groupId: number): Promise<AxiosResponse<any[]>> => api.get(`/schedules/group/${groupId}/relevant`),
  create: (schedule: any): Promise<AxiosResponse<any>> => api.post('/schedules', schedule),
  update: (id: number, schedule: any): Promise<AxiosResponse<any>> => api.put(`/schedules/${id}`, schedule),
};

export const transferRequestAPI = {
  getAll: (): Promise<AxiosResponse<any[]>> => api.get('/transfer-requests'),
  getById: (id: number): Promise<AxiosResponse<any>> => api.get(`/transfer-requests/${id}`),
  getByStudent: (studentId: number): Promise<AxiosResponse<any[]>> => api.get(`/transfer-requests/student/${studentId}`),
  getByManager: (managerId: number): Promise<AxiosResponse<any[]>> => api.get(`/transfer-requests/manager/${managerId}`),
  create: (request: any): Promise<AxiosResponse<any>> => api.post('/transfer-requests', request),
  update: (id: number, request: any): Promise<AxiosResponse<any>> => api.put(`/transfer-requests/${id}`, request),
};

export const teamChangeRequestAPI = {
  getAll: (): Promise<AxiosResponse<any[]>> => api.get('/team-change-requests'),
  getById: (id: number): Promise<AxiosResponse<any>> => api.get(`/team-change-requests/${id}`),
  create: (request: any): Promise<AxiosResponse<any>> => api.post('/team-change-requests', request),
  update: (id: number, request: any): Promise<AxiosResponse<any>> => api.put(`/team-change-requests/${id}`, request),
};

export const elderChangeRequestAPI = {
  getAll: (): Promise<AxiosResponse<any[]>> => api.get('/elder-change-requests'),
  getById: (id: number): Promise<AxiosResponse<any>> => api.get(`/elder-change-requests/${id}`),
  create: (request: any): Promise<AxiosResponse<any>> => api.post('/elder-change-requests', request),
  update: (id: number, request: any): Promise<AxiosResponse<any>> => api.put(`/elder-change-requests/${id}`, request),
};

export const managerAPI = {
  getInactive: (page: number = 0, size: number = 10): Promise<AxiosResponse<any>> => 
    api.get('/managers/inactive', { params: { page, size } }),
  activate: (userId: number): Promise<AxiosResponse<any>> => api.post(`/managers/${userId}/activate`),
};

export default api;

