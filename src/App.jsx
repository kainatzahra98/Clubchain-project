// Cloud Connected Build - 2026-05-01
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoadingOverlay from './components/UI/LoadingOverlay';
import './styles/global.css';

// Lazy load all pages so only the current page's code is downloaded on first visit
const LandingPage = React.lazy(() => import('./pages/Public/LandingPage'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Dashboard = React.lazy(() => import('./pages/Admin/Dashboard'));
const MemberProfile = React.lazy(() => import('./pages/Admin/MemberProfile'));
const Management = React.lazy(() => import('./pages/Admin/Management'));
const FeedbackDashboard = React.lazy(() => import('./pages/Admin/FeedbackDashboard'));
const Events = React.lazy(() => import('./pages/Admin/Events'));
const MembershipPlans = React.lazy(() => import('./pages/Admin/MembershipPlans'));
const ClubsManagement = React.lazy(() => import('./pages/Admin/ClubsManagement'));
const Settings = React.lazy(() => import('./pages/Admin/Settings'));
const IntroLetters = React.lazy(() => import('./pages/Admin/IntroLetters'));
const Payments = React.lazy(() => import('./pages/Admin/Payments'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingOverlay />}>
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
          <Route path="/admin/events" element={<Events />} />
          <Route path="/admin/membership-plans" element={<MembershipPlans />} />
          <Route path="/admin/letters" element={<IntroLetters />} />
          <Route path="/admin/payments" element={<Payments />} />
          <Route path="/admin/settings" element={<Settings />} />

          {/* Default logic */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
