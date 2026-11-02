import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import FloodSensePage from './pages/dashboard/FloodSensePage';
import WaterStressPage from './pages/dashboard/WaterStressPage';
import SmartRecoveryPage from './pages/dashboard/SmartRecoveryPage';
import CitizenReportsPage from './pages/dashboard/CitizenReportsPage';
import AlertsPage from './pages/dashboard/AlertsPage';
import WeatherPage from './pages/dashboard/WeatherPage';
import AquaAIPage from './pages/dashboard/AquaAIPage';
import EmergencyPage from './pages/dashboard/EmergencyPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import SettingsPage from './pages/dashboard/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />

      {/* Protected dashboard routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardOverview />} />
        <Route path="floodsense" element={<FloodSensePage />} />
        <Route path="water-stress" element={<WaterStressPage />} />
        <Route path="smart-recovery" element={<SmartRecoveryPage />} />
        <Route path="recovery" element={<SmartRecoveryPage />} />
        <Route path="citizen-reports" element={<CitizenReportsPage />} />
        <Route path="reports" element={<CitizenReportsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="weather" element={<WeatherPage />} />
        <Route path="aqua-ai" element={<AquaAIPage />} />
        <Route path="emergency" element={<EmergencyPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
