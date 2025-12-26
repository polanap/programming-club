import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ManagerDashboard from './pages/ManagerDashboard';
import CuratorDashboard from './pages/CuratorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ClassRoom from './pages/ClassRoom';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/manager/*"
              element={
                <PrivateRoute requiredRole="MANAGER">
                  <ManagerDashboard />
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
}

export default App;

