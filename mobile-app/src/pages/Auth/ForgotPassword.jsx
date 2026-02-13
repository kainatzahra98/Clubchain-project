import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/Auth/AuthLayout';
import Button from '../../components/UI/Button';
import api from '../../utils/api';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Steps: 'request' (enter email) -> 'verify' (enter OTP) -> 'reset' (enter new password)
    const [step, setStep] = useState('request');
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Request OTP
    const handleRequestOtp = async (inputEmail = email) => {
        if (typeof inputEmail !== 'string') inputEmail = email;

        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email: inputEmail });
            // Move to Step 2: Verify
            setStep('verify');
            setSuccessMessage(`Verification code sent to ${inputEmail}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset code');
            // If auto-send failed, stay on request step to let user fix email
            setStep('request');
        } finally {
            setLoading(false);
        }
    };

    // Auto-trigger if email came from Login page
    React.useEffect(() => {
        if (location.state?.email) {
            handleRequestOtp(location.state.email);
            // Clear location state to prevent loop/re-trigger
            window.history.replaceState({}, document.title);
        }
    }, []);

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            // New endpoint to validate OTP without consuming it
            await api.post('/auth/validate-reset-otp', { email, otp });
            // Move to Step 3: Reset Password
            setStep('reset');
            setSuccessMessage('Code verified. Please set your new password.');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Set New Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                email,
                otp,
                newPassword
            });
            setSuccessMessage('Password reset successful. Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Password reset failed');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        if (step === 'verify') return 'Verify Code';
        if (step === 'reset') return 'Set New Password';
        return 'Reset Password';
    };

    const getSubtitle = () => {
        if (step === 'verify') return `Enter the code sent to ${email}`;
        if (step === 'reset') return 'Create a new password';
        return 'Enter your email to receive a code';
    };

    return (
        <AuthLayout title={getTitle()} subtitle={getSubtitle()}>
            {/* STEP 1: REQUEST EMAIL */}
            {step === 'request' && (
                <form onSubmit={(e) => { e.preventDefault(); handleRequestOtp(email); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                    {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
                    <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ height: '3.5rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                        {loading ? 'Sending Code...' : 'Send Reset Code'}
                    </Button>
                    <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
                        Remember your password? <Link to="/login" style={{ color: '#3a7bd5', fontWeight: 'bold', textDecoration: 'none' }}>Sign In</Link>
                    </div>
                </form>
            )}

            {/* STEP 2: VERIFY OTP */}
            {step === 'verify' && (
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
                    {successMessage && <div style={{ color: '#10b981', fontSize: '0.85rem', textAlign: 'center' }}>{successMessage}</div>}

                    <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ height: '3.5rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </Button>
                    <button
                        type="button"
                        onClick={() => setStep('request')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            marginTop: '1rem'
                        }}
                    >
                        Change Email
                    </button>
                </form>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {step === 'reset' && (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
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
                        <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Confirm New Password</label>
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

                    {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
                    {successMessage && <div style={{ color: '#10b981', fontSize: '0.85rem', textAlign: 'center' }}>{successMessage}</div>}

                    <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ height: '3.5rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                        {loading ? 'Reseting Password...' : 'Reset Password'}
                    </Button>
                </form>
            )}
        </AuthLayout>
    );
};

export default ForgotPassword;
