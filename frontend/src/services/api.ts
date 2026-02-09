import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Group,
  GroupResponse,
  CreateScheduleRequest,
  TransferRequest,
  CreateTransferRequestDTO,
  AddAvailableGroupsDTO,
  SelectGroupDTO,
  CuratorCommentDTO,
  Schedule,
  ClassResponseDTO,
  TeamResponseDTO,
  TeamChangeRequest,
  TeamChangeRequestDTO,
  ElderChangeRequest,
  ElderChangeRequestDTO,
  Task,
} from '../types';

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
  getMyManagerGroups: (): Promise<AxiosResponse<Group[]>> => api.get('/groups/manager/my'),
  getMyCuratorGroups: (): Promise<AxiosResponse<Group[]>> => api.get('/groups/curator/my'),
  getMyStudentGroups: (): Promise<AxiosResponse<Group[]>> => api.get('/groups/student/my'),
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
  deleteSchedule: (groupId: number, scheduleId: number): Promise<AxiosResponse<void>> => 
    api.delete(`/groups/${groupId}/schedules/${scheduleId}`),
  startGroup: (groupId: number): Promise<AxiosResponse<void>> => api.post(`/groups/${groupId}/start`),
  getGroupUsersByRole: (groupId: number, role: string): Promise<AxiosResponse<User[]>> => 
    api.get(`/groups/${groupId}/users/${role}`),
  getGroupsWhereStudentNotMember: (studentUserRoleId: number): Promise<AxiosResponse<Group[]>> => 
    api.get(`/groups/not-member/${studentUserRoleId}`),
};

export const taskAPI = {
  getAll: (): Promise<AxiosResponse<any[]>> => api.get('/tasks'),
  getById: (id: number): Promise<AxiosResponse<any>> => api.get(`/tasks/${id}`),
  getByAuthor: (authorId: number): Promise<AxiosResponse<any[]>> => api.get(`/tasks/author/${authorId}`),
  getOpen: (): Promise<AxiosResponse<any[]>> => api.get('/tasks/open'),
  create: (task: any): Promise<AxiosResponse<any>> => api.post('/tasks', task),
  update: (id: number, task: any): Promise<AxiosResponse<any>> => api.put(`/tasks/${id}`, task),
  delete: (id: number): Promise<AxiosResponse<void>> => api.delete(`/tasks/${id}`),
  // Curator-specific endpoints
  getAvailableForCurator: (): Promise<AxiosResponse<any[]>> => api.get('/tasks/curator/available'),
  getMyTasks: (): Promise<AxiosResponse<any[]>> => api.get('/tasks/curator/my'),
};

export const classAPI = {
  getAll: (): Promise<AxiosResponse<ClassResponseDTO[]>> => api.get('/classes'),
  getById: (id: number): Promise<AxiosResponse<ClassResponseDTO>> => api.get(`/classes/${id}`),
  getBySchedule: (scheduleId: number): Promise<AxiosResponse<ClassResponseDTO[]>> => api.get(`/classes/schedule/${scheduleId}`),
  getByGroup: (groupId: number): Promise<AxiosResponse<ClassResponseDTO[]>> => api.get(`/classes/group/${groupId}`),
  getMyClasses: (): Promise<AxiosResponse<ClassResponseDTO[]>> => api.get('/classes/curator/my'),
  assignTask: (classId: number, taskId: number): Promise<AxiosResponse<void>> => 
    api.post(`/classes/${classId}/tasks/${taskId}`),
  removeTask: (classId: number, taskId: number): Promise<AxiosResponse<void>> => 
    api.delete(`/classes/${classId}/tasks/${taskId}`),
  getTasks: (id: number): Promise<AxiosResponse<Task[]>> => api.get(`/classes/${id}/tasks`),
};

export const teamAPI = {
  getAll: (): Promise<AxiosResponse<any[]>> => api.get('/teams'),
  getById: (id: number): Promise<AxiosResponse<any>> => api.get(`/teams/${id}`),
  getByClass: (classId: number): Promise<AxiosResponse<TeamResponseDTO[]>> => api.get(`/teams/class/${classId}`),
};

export const scheduleAPI = {
  getAll: (): Promise<AxiosResponse<Schedule[]>> => api.get('/schedules'),
  getById: (id: number): Promise<AxiosResponse<Schedule>> => api.get(`/schedules/${id}`),
  getByGroup: (groupId: number): Promise<AxiosResponse<Schedule[]>> => api.get(`/schedules/group/${groupId}`),
  getRelevantByGroup: (groupId: number): Promise<AxiosResponse<Schedule[]>> => api.get(`/schedules/group/${groupId}/relevant`),
  create: (schedule: any): Promise<AxiosResponse<any>> => api.post('/schedules', schedule),
  update: (id: number, schedule: any): Promise<AxiosResponse<any>> => api.put(`/schedules/${id}`, schedule),
};

export const transferRequestAPI = {
  // Common endpoints
  getAll: (): Promise<AxiosResponse<TransferRequest[]>> => api.get('/transfer-request'),
  getById: (id: number): Promise<AxiosResponse<TransferRequest>> => api.get(`/transfer-request/${id}`),
  getByStatus: (status: string): Promise<AxiosResponse<TransferRequest[]>> => api.get(`/transfer-request/status/${status}`),
  changeStatus: (status: string, requestId: number): Promise<AxiosResponse<TransferRequest>> => 
    api.post(`/transfer-request/status/${status}`, null, { params: { requestId } }),
  
  // Student endpoints
  create: (dto: CreateTransferRequestDTO): Promise<AxiosResponse<TransferRequest>> => 
    api.post('/transfer-request', dto),
  getMyRequests: (): Promise<AxiosResponse<TransferRequest[]>> => api.get('/transfer-request/my'),
  selectGroup: (requestId: number, dto: SelectGroupDTO): Promise<AxiosResponse<TransferRequest>> => 
    api.post(`/transfer-request/${requestId}/select-group`, dto),
  withdraw: (requestId: number): Promise<AxiosResponse<TransferRequest>> => 
    api.post(`/transfer-request/${requestId}/withdraw`),
  
  // Manager endpoints
  getUnassigned: (): Promise<AxiosResponse<TransferRequest[]>> => api.get('/transfer-request/unassigned'),
  takeRequest: (requestId: number): Promise<AxiosResponse<TransferRequest>> => 
    api.post(`/transfer-request/${requestId}/take`),
  getMyManagerRequests: (): Promise<AxiosResponse<TransferRequest[]>> => api.get('/transfer-request/my-manager'),
  requestClarification: (requestId: number, curatorId: number): Promise<AxiosResponse<TransferRequest>> => 
    api.post(`/transfer-request/${requestId}/request-clarification`, { curatorId }),
  getGroupCurators: (requestId: number): Promise<AxiosResponse<any[]>> => 
    api.get(`/transfer-request/${requestId}/curators`),
  addAvailableGroups: (dto: AddAvailableGroupsDTO): Promise<AxiosResponse<TransferRequest>> => 
    api.post('/transfer-request/add-groups', dto),
  
  // Curator endpoints
  getMyCuratorRequests: (): Promise<AxiosResponse<TransferRequest[]>> => api.get('/transfer-request/curator/my'),
  getCuratorPendingRequests: (): Promise<AxiosResponse<TransferRequest[]>> => api.get('/transfer-request/curator/pending'),
  addCuratorComment: (requestId: number, dto: CuratorCommentDTO): Promise<AxiosResponse<TransferRequest>> => 
    api.post(`/transfer-request/${requestId}/curator-comment`, dto),
  
  // Legacy endpoints (for backward compatibility)
  getByStudent: (studentId: number): Promise<AxiosResponse<TransferRequest[]>> => 
    api.get(`/transfer-request/student/${studentId}`),
  getByManager: (managerId: number): Promise<AxiosResponse<TransferRequest[]>> => 
    api.get(`/transfer-request/manager/${managerId}`),
};

export const teamChangeRequestAPI = {
  getAll: (): Promise<AxiosResponse<TeamChangeRequest[]>> => api.get('/team-change-requests'),
  getById: (id: number): Promise<AxiosResponse<TeamChangeRequest>> => api.get(`/team-change-requests/${id}`),
  getByClass: (classId: number): Promise<AxiosResponse<TeamChangeRequest[]>> => api.get(`/team-change-requests/class/${classId}`),
  create: (dto: TeamChangeRequestDTO): Promise<AxiosResponse<void>> => api.post('/team-change-requests', dto),
  process: (requestId: number, approved: boolean): Promise<AxiosResponse<void>> =>
    api.post(`/team-change-requests/${requestId}/process`, null, { params: { approved } }),
};

export const elderChangeRequestAPI = {
  getAll: (): Promise<AxiosResponse<ElderChangeRequest[]>> => api.get('/elder-change-requests'),
  getById: (id: number): Promise<AxiosResponse<ElderChangeRequest>> => api.get(`/elder-change-requests/${id}`),
  create: (dto: ElderChangeRequestDTO): Promise<AxiosResponse<void>> => api.post('/elder-change-requests', dto),
};

export const managerAPI = {
  getInactive: (page: number = 0, size: number = 10): Promise<AxiosResponse<any>> => 
    api.get('/managers/inactive', { params: { page, size } }),
  activate: (userId: number): Promise<AxiosResponse<any>> => api.post(`/managers/${userId}/activate`),
};

export const testAPI = {
  getByTask: (taskId: number): Promise<AxiosResponse<any[]>> => api.get(`/tasks/${taskId}/tests`),
  create: (taskId: number, test: any): Promise<AxiosResponse<any>> => api.post(`/tasks/${taskId}/tests`, test),
  update: (testId: number, test: any): Promise<AxiosResponse<any>> => api.put(`/tests/${testId}`, test),
  delete: (testId: number): Promise<AxiosResponse<void>> => api.delete(`/tests/${testId}`),
};

export const classSessionAPI = {
  joinAsStudent: (classId: number): Promise<AxiosResponse<void>> => 
    api.post(`/class-session/${classId}/join/student`),
  leaveAsStudent: (classId: number): Promise<AxiosResponse<void>> => 
    api.post(`/class-session/${classId}/leave/student`),
  joinAsCurator: (classId: number): Promise<AxiosResponse<void>> => 
    api.post(`/class-session/${classId}/join/curator`),
  leaveAsCurator: (classId: number): Promise<AxiosResponse<void>> => 
    api.post(`/class-session/${classId}/leave/curator`),
  joinTeam: (teamId: number): Promise<AxiosResponse<void>> => 
    api.post(`/class-session/team/${teamId}/join`),
  leaveTeam: (teamId: number): Promise<AxiosResponse<void>> => 
    api.post(`/class-session/team/${teamId}/leave`),
  blockTeamSubmission: (teamId: number, blocked: boolean): Promise<AxiosResponse<void>> => 
    api.post(`/class-session/team/${teamId}/block-submission`, null, { params: { blocked } }),
  toggleHand: (teamId: number): Promise<AxiosResponse<void>> => 
    api.post(`/class-session/team/${teamId}/toggle-hand`),
  selectTask: (teamId: number, taskId: number): Promise<AxiosResponse<void>> => 
    api.post(`/class-session/team/${teamId}/select-task/${taskId}`),
  submitSolution: (teamId: number, taskId: number, solution?: string): Promise<AxiosResponse<any>> => 
    api.post(`/class-session/team/${teamId}/submit-solution/${taskId}`, solution || null),
  getClassEvents: (classId: number): Promise<AxiosResponse<any[]>> => 
    api.get(`/events/class/${classId}`),
  getTeamStatus: (teamId: number): Promise<AxiosResponse<{ isBlocked: boolean; handRaised: boolean; selectedTaskId: number | null }>> => 
    api.get(`/class-session/team/${teamId}/status`),
  isCuratorJoined: (teamId: number): Promise<AxiosResponse<{ isJoined: boolean }>> => 
    api.get(`/class-session/team/${teamId}/is-curator-joined`),
  getJoinedCurators: (teamId: number): Promise<AxiosResponse<number[]>> => 
    api.get(`/class-session/team/${teamId}/joined-curators`),
};

export default api;

