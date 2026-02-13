import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/Auth/AuthLayout';
import api from '../../utils/api';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role') || 'system-admin';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const userData = response.data;

            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(userData));

            // Redirect based on role and platform requirement
            if (userData.role === 'SYSTEM_ADMIN') {
                navigate('/admin');
            } else if (userData.role === 'CLUB_ADMIN') {
                // For web portal, club admins also see the admin area but limited
                navigate('/admin');
            } else {
                // Clients shouldn't really be here but handle just in case
                setError('Please use the mobile app for client portal');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };
    const titles = {
        'system-admin': { title: "System Administration", subtitle: "Executive access to top-level controls" }
    };

    const currentRoleInfo = titles[role] || titles['system-admin'];

    return (
        <AuthLayout
            role={role}
            title={currentRoleInfo.title}
            subtitle={currentRoleInfo.subtitle}
        >
            <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="form-options">
                    <label className="checkbox-container">
                        <input type="checkbox" />
                        <span className="checkmark"></span>
                        Remember me
                    </label>
                    <Link to="#" className="forgot-link">Forgot password?</Link>
                </div>
                {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <button type="submit" className="btn-auth-submit" disabled={loading}>
                    {loading ? 'Entering Portal...' : 'Login to ClubChain'}
                </button>
            </form>
        </AuthLayout>
    );
};

const Button = ({ role, current }) => (
    <Link
        to={`/login?role=${role}`}
        className={`role-btn ${current === role ? 'active' : ''}`}
    >
        {role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
    </Link>
);

export default Login;
