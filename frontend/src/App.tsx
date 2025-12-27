import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/privateRoute/PrivateRoute';
import Register from './pages/register/Register';
import ManagerDashboard from './pages/dashBoards/managerDashBoard/ManagerDashboard';
import ManagerActivation from './pages/managerActivation/ManagerActivation';
import GroupManagement from './pages/groupManagement/GroupManagement';
import CuratorDashboard from './pages/dashBoards/curatorDashBoard/CuratorDashboard';
import ClassRoom from './pages/classRoom/ClassRoom';
import StudentDashboard from './pages/dashBoards/studentDashboard/StudentDashboard';
import Login from './pages/login/Login';

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
              path="/curator/*"
              element={
                <PrivateRoute requiredRole="CURATOR">
                  <CuratorDashboard />
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

