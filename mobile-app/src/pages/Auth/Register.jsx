import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/Auth/AuthLayout';
import Button from '../../components/UI/Button';
import api from '../../utils/api';

const Register = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('client');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('register'); // 'register' or 'otp'
    const [otp, setOtp] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', {
                ...formData,
                role: role === 'admin' ? 'CLUB_ADMIN' : 'CLIENT'
            });
            // On success, move to OTP step
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/auth/verify-otp', {
                email: formData.email,
                otp
            });

            // Login successful with token
            localStorage.setItem('user', JSON.stringify(data)); // Store full user object including token matches api.js expectation

            // Assuming the app checks localStorage or we should use a Context method if available. 
            // For now, simple redirect + if there's an AuthContext it might need a reload or manual set.
            // Let's assume navigating to login or dashboard works.
            navigate('/dashboard'); // Or login, but usually auto-login is better
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={step === 'register' ? "Create Account" : "Verify Email"}
            subtitle={step === 'register' ? "Join the exclusive ClubChain community" : `Enter the code sent to ${formData.email}`}
        >
            {step === 'register' ? (
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Full Name</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            style={{
                                padding: '0.875rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: '#f8fafc',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            style={{
                                padding: '0.875rem',
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
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            style={{
                                padding: '0.875rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: '#f8fafc',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Confirm Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{
                                padding: '0.875rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: '#f8fafc',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>I am a...</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setRole('client')}
                                style={{
                                    flex: 1, padding: '0.75rem', borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer',
                                    border: '1px solid ' + (role === 'client' ? '#3a7bd5' : 'rgba(0,0,0,0.1)'),
                                    background: role === 'client' ? 'rgba(58, 123, 213, 0.1)' : 'white',
                                    color: role === 'client' ? '#3a7bd5' : '#64748b',
                                    fontWeight: role === 'client' ? 'bold' : 'normal',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Member
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                style={{
                                    flex: 1, padding: '0.75rem', borderRadius: '10px', fontSize: '0.9rem', cursor: 'pointer',
                                    border: '1px solid ' + (role === 'admin' ? '#3a7bd5' : 'rgba(0,0,0,0.1)'),
                                    background: role === 'admin' ? 'rgba(58, 123, 213, 0.1)' : 'white',
                                    color: role === 'admin' ? '#3a7bd5' : '#64748b',
                                    fontWeight: role === 'admin' ? 'bold' : 'normal',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Club Admin
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="checkbox" required id="terms" />
                        <label htmlFor="terms" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            I agree to the <Link to="#" style={{ color: '#3a7bd5', textDecoration: 'none' }}>Terms of Service</Link>
                        </label>
                    </div>

                    {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

                    <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ height: '3.5rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>

                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                        Already have an account? <Link to="/login" style={{ color: '#3a7bd5', fontWeight: 'bold', textDecoration: 'none' }}>Sign In</Link>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Verification Code</label>
                        <input
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            maxLength={6}
                            style={{
                                padding: '0.875rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: '#f8fafc',
                                outline: 'none',
                                fontSize: '1.5rem',
                                letterSpacing: '0.5rem',
                                textAlign: 'center'
                            }}
                        />
                    </div>

                    {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

                    <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ height: '3.5rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </Button>

                    <button
                        type="button"
                        onClick={() => setStep('register')}
                        style={{
                            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', marginTop: '1rem'
                        }}
                    >
                        Back to Registration
                    </button>
                </form>
            )}
        </AuthLayout>
    );
};

export default Register;
