import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Public/LandingPage';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Admin/Dashboard';
import MemberProfile from './pages/Admin/MemberProfile';
import Management from './pages/Admin/Management';
import FeedbackDashboard from './pages/Admin/FeedbackDashboard';
import IntroLetters from './pages/Admin/IntroLetters';
import Events from './pages/Admin/Events';
import MembershipPlans from './pages/Admin/MembershipPlans';
import ClubsManagement from './pages/Admin/ClubsManagement';
import Settings from './pages/Admin/Settings';
import LoadingOverlay from './components/UI/LoadingOverlay';
import './styles/global.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial application load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />

        {/* Web App: System Admin Interface */}
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/members" element={<Management />} />
        <Route path="/admin/clubs" element={<ClubsManagement />} />
        <Route path="/admin/profile" element={<MemberProfile />} />
        <Route path="/admin/feedback" element={<FeedbackDashboard />} />
        <Route path="/admin/letters" element={<IntroLetters />} />
        <Route path="/admin/events" element={<Events />} />
        <Route path="/admin/membership-plans" element={<MembershipPlans />} />
        <Route path="/admin/settings" element={<Settings />} />

        {/* Default logic */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
