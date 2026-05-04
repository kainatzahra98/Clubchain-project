import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/Auth/AuthLayout';
import Button from '../../components/UI/Button';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../../utils/api';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const userData = response.data;

            if (!userData.token) {
                setError('Login failed: No access token received from server.');
                return;
            }

            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(userData));

            // Redirect based on role
            if (userData.role === 'CLUB_ADMIN') {
                navigate('/club-admin');
            } else if (userData.role === 'CLIENT') {
                navigate('/client');
            } else if (userData.role === 'SYSTEM_ADMIN') {
                setError('System Admin must use the web portal');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Please enter your details to sign in"
        >
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Email Address</label>
                    <input
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: '#f8fafc',
                            outline: 'none',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                padding: '1rem',
                                paddingRight: '3rem', // Add space for eye icon
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: '#f8fafc',
                                outline: 'none',
                                fontSize: '1rem',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                color: '#64748b',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <Link to="/forgot-password" state={{ email }} style={{ fontSize: '0.85rem', color: '#3a7bd5', textDecoration: 'none' }}>Forgot Password?</Link>
                </div>

                {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

                <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ height: '3.5rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                    {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#3a7bd5', fontWeight: 'bold', textDecoration: 'none' }}>Create Account</Link>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Login;
