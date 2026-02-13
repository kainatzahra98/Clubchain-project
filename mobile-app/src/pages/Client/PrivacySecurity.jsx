import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Toast from '../../components/UI/Toast';
import api from '../../utils/api';
import { FaChevronLeft, FaLock, FaShieldAlt, FaExternalLinkAlt, FaEnvelope, FaKey, FaShieldVirus } from 'react-icons/fa';

const PrivacySecurity = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('menu'); // menu, otpData, verify
    const [email, setEmail] = useState(JSON.parse(localStorage.getItem('user'))?.email || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Step 1: Send OTP
    const handleInitiateReset = async () => {
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setToast({ message: 'OTP sent to your email.', type: 'success' });
            setStep('verify');
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to send OTP', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify & Reset
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setToast({ message: 'Password updated successfully!', type: 'success' });
            setTimeout(() => {
                setStep('menu');
                setOtp('');
                setNewPassword('');
            }, 1500);
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to reset password', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => step === 'menu' ? navigate(-1) : setStep('menu')} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                    <FaChevronLeft />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Privacy & Security</h1>
            </div>

            {step === 'menu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Card>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaLock style={{ color: '#ec4899' }} /> Security
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                            Update your password securely using email verification.
                        </p>
                        <Button variant="secondary" fullWidth onClick={handleInitiateReset} disabled={loading}>
                            {loading ? 'Sending OTP...' : 'Change Password'}
                        </Button>
                    </Card>

                    <Card>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaShieldAlt style={{ color: '#3b82f6' }} /> Data & Privacy
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5', marginBottom: '1rem' }}>
                            Your data is encrypted and stored securely. We maintain strict privacy controls.
                        </p>
                        <Button variant="outline" fullWidth style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }} onClick={() => window.open('#', '_blank')}>
                            <FaExternalLinkAlt /> View Privacy Policy
                        </Button>
                    </Card>
                </div>
            )}

            {step === 'verify' && (
                <Card>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Verify & Update</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                        Enter the verification code sent to <strong>{email}</strong> and your new password.
                    </p>
                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Verification Code</label>
                            <div style={{ position: 'relative' }}>
                                <FaShieldVirus style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="text"
                                    placeholder="Entered OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <FaKey style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                                />
                            </div>
                        </div>
                        <Button type="submit" variant="primary" fullWidth disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                </Card>
            )}
        </div>
    );
};

export default PrivacySecurity;
