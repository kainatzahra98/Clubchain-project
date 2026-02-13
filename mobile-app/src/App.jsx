import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import ClientApp from './pages/Client/ClientApp';
import ClubAdminApp from './pages/ClubAdmin/ClubAdminApp';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ProtectedRoute from './components/Auth/ProtectedRoute';

import Button from './components/UI/Button';
import { FaMobileAlt, FaUserTie } from 'react-icons/fa';
import logo from './assets/logo.png';

// Helper component to redirect authenticated users
const RedirectIfLoggedIn = ({ children }) => {
    const userString = localStorage.getItem('user');
    if (userString) {
        try {
            const user = JSON.parse(userString);
            if (user && user.token) {
                if (user.role === 'CLUB_ADMIN') return <Navigate to="/club-admin" replace />;
                if (user.role === 'CLIENT') return <Navigate to="/client" replace />;
            }
        } catch (e) {
            localStorage.removeItem('user');
        }
    }
    return children;
};

const Landing = () => (
    <RedirectIfLoggedIn>
        <div style={{
            height: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            color: '#1a1a2e',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2.5rem',
            padding: '2rem'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '1.5rem',
                    borderRadius: '30px',
                    display: 'inline-block',
                    marginBottom: '1.5rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(5px)'
                }}>
                    <img src={logo} alt="ClubChain" style={{
                        height: '100px',
                        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))'
                    }} />
                </div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#1a1a2e' }}>ClubChain Mobile</h1>
                <p style={{ color: '#4b5563', fontSize: '1.1rem' }}>Select your portal to continue</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" fullWidth style={{ height: '3.5rem', fontSize: '1.1rem' }}>
                        Sign In
                    </Button>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Button variant="secondary" fullWidth style={{ height: '3.5rem', fontSize: '1.1rem' }}>
                        Join Now
                    </Button>
                </Link>

                <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Quick Access</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Link to="/client" style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" fullWidth style={{ fontSize: '0.85rem', padding: '0.75rem' }}>Client</Button>
                    </Link>
                    <Link to="/club-admin" style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" fullWidth style={{ fontSize: '0.85rem', padding: '0.75rem' }}>Club-Admin</Button>
                    </Link>
                </div>
            </div>

            <p style={{ position: 'absolute', bottom: '2rem', color: '#444', fontSize: '0.8rem' }}>v1.0.0 • ClubChain Inc.</p>
        </div>
    </RedirectIfLoggedIn>
);

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={
                    <RedirectIfLoggedIn>
                        <Login />
                    </RedirectIfLoggedIn>
                } />
                <Route path="/register" element={
                    <RedirectIfLoggedIn>
                        <Register />
                    </RedirectIfLoggedIn>
                } />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/client/*" element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                        <ClientApp />
                    </ProtectedRoute>
                } />
                <Route path="/club-admin/*" element={
                    <ProtectedRoute allowedRoles={['CLUB_ADMIN']}>
                        <ClubAdminApp />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
