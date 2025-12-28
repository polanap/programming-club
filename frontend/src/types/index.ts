export enum RoleEnum {
  STUDENT = 'STUDENT',
  CURATOR = 'CURATOR',
  MANAGER = 'MANAGER'
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  registrationDate: string;
}

export interface Group {
  id: number;
  startTime: string;
  isStarted?: boolean;
}

export interface GroupResponse {
  id: number;
  startTime: string;
  isStarted: boolean;
  canStart: boolean;
}

export interface Schedule {
  id: number;
  dayOfWeek: DayOfWeek;
  classStartTime: string;
  classEndTime: string;
  isRelevant: boolean;
}

export interface Task {
  id: number;
  condition: string;
  authorId: number;
  isOpen: boolean;
}

export interface Team {
  id: number;
  classId: number;
  elderId: number;
}

export interface Class {
  id: number;
  scheduleId: number;
}

export interface CreateScheduleRequest {
  dayOfWeek: DayOfWeek;
  classStartTime: string;
  classEndTime: string;
}

export interface AddUserToGroupRequest {
  userId: number;
  role: string;
}

export type UserType = 'STUDENT' | 'CURATOR' | 'MANAGER';

export interface GroupUsers {
  students: User[];
  curators: User[];
  managers: User[];
}

export interface UsersByType {
  students: User[];
  curators: User[];
  managers: User[];
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  roles: RoleEnum[];
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: RoleEnum;
}

export interface CodeChangeMessage {
  type: 'INSERT' | 'DELETE' | 'REPLACE';
  teamId: number;
  lineNumber: number;
  content: string;
  position: number;
  userId: string;
}

export interface LockMessage {
  teamId: number;
  lineNumber: number;
  action: 'LOCK' | 'UNLOCK';
  userId: string;
  userRole: string;
}

export interface LineLock {
  userId: string;
  userRole: string;
}

export interface InactiveManager {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  registrationDate: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
