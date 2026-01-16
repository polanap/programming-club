import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/privateRoute/PrivateRoute';
import Register from './pages/register/Register';
import ManagerDashboard from './pages/dashBoards/managerDashBoard/ManagerDashboard';
import ManagerActivation from './pages/managerActivation/ManagerActivation';
import GroupManagement from './pages/groupManagement/GroupManagement';
import CuratorDashboard from './pages/dashBoards/curatorDashBoard/CuratorDashboard';
import TaskManagement from './pages/taskManagement/TaskManagement';
import ClassManagement from './pages/classManagement/ClassManagement';
import ClassRoom from './pages/classRoom/ClassRoom';
import StudentDashboard from './pages/dashBoards/studentDashboard/StudentDashboard';
import StudentTransferRequest from './pages/transferRequest/StudentTransferRequest';
import ManagerTransferRequest from './pages/transferRequest/ManagerTransferRequest';
import CuratorTransferRequest from './pages/transferRequest/CuratorTransferRequest';
import CuratorTeamChangeRequests from './pages/teamChangeRequests/CuratorTeamChangeRequests';
import Login from './pages/login/Login';
import StudentGroups from './pages/studentGroups/StudentGroups';
import StudentGroupClasses from './pages/studentGroups/StudentGroupClasses';

import './App.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/manager"
              element={
                <PrivateRoute requiredRole="MANAGER">
                  <ManagerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/manager/activation"
              element={
                <PrivateRoute requiredRole="MANAGER">
                  <ManagerActivation />
                </PrivateRoute>
              }
            />
            <Route
              path="/manager/groups"
              element={
                <PrivateRoute requiredRole="MANAGER">
                  <GroupManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/manager/transfer-requests"
              element={
                <PrivateRoute requiredRole="MANAGER">
                  <ManagerTransferRequest />
                </PrivateRoute>
              }
            />
            <Route
              path="/curator"
              element={
                <PrivateRoute requiredRole="CURATOR">
                  <CuratorDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/curator/tasks"
              element={
                <PrivateRoute requiredRole="CURATOR">
                  <TaskManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/curator/classes"
              element={
                <PrivateRoute requiredRole="CURATOR">
                  <ClassManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/curator/transfer-requests"
              element={
                <PrivateRoute requiredRole="CURATOR">
                  <CuratorTransferRequest />
                </PrivateRoute>
              }
            />
            <Route
              path="/curator/team-change-requests"
              element={
                <PrivateRoute requiredRole="CURATOR">
                  <CuratorTeamChangeRequests />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/*"
              element={
                <PrivateRoute requiredRole="STUDENT">
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/transfer-request"
              element={
                <PrivateRoute requiredRole="STUDENT">
                  <StudentTransferRequest />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/groups"
              element={
                <PrivateRoute requiredRole="STUDENT">
                  <StudentGroups />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/groups/:groupId"
              element={
                <PrivateRoute requiredRole="STUDENT">
                  <StudentGroupClasses />
                </PrivateRoute>
              }
            />
            <Route
              path="/classroom/:classId"
              element={
                <PrivateRoute>
                  <ClassRoom />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;

