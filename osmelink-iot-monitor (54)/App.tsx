
import React, { useState } from 'react';
// @ts-ignore
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Replay from './pages/Replay';
import Trends from './pages/Trends';
import LiveTracking from './pages/LiveTracking';
import CustomerManagement from './pages/CustomerManagement';
import DealerManagement from './pages/DealerManagement';
import VehicleOnboarding from './pages/VehicleOnboarding';
import RawData from './pages/RawData';
import MainLayout from './components/Layout/MainLayout';

interface UserProfile {
  username: string;
  role: 'Admin' | 'User' | 'Customer';
  customerCode?: string;
  email?: string;
  assignedVehicles?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
});

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('osme_user_profile');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user;

  const login = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('osme_auth_session', 'true');
    localStorage.setItem('osme_user_profile', JSON.stringify(profile));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('osme_auth_session');
    localStorage.removeItem('osme_user_profile');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
          />
          
          <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/replay" element={<Replay />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/live-tracking" element={<LiveTracking />} />
            <Route path="/raw-data" element={<RawData />} />
            
            <Route path="/management/users" element={<CustomerManagement />} />
            <Route path="/management/dealers" element={<DealerManagement />} />
            <Route path="/management/onboarding" element={<VehicleOnboarding />} />
            
            <Route path="/admin" element={<Admin />} />
          </Route>
          
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;
