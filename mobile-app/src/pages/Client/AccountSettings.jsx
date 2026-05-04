import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { FaChevronLeft, FaSave, FaUser, FaEnvelope } from 'react-icons/fa';

const AccountSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Using /auth/me which is mounted at /api/auth/me
            const res = await api.get('/auth/me');
            if (res.data) {
                    setFormData({
                        name: res.data.name || '',
                        email: res.data.email || '',
                        phone: res.data.phone || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    });
                    if (res.data.avatar) {
                        setAvatarPreview(`${api.defaults.baseURL.replace('/api', '')}${res.data.avatar}`);
                    }
            }
        } catch (err) {
            console.error(err);
            // Don't alert immediately on load, just log it. 
            // Often "failed to load" is just a token issue handled by interceptors.
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('phone', formData.phone);
            
            if (avatarFile) {
                data.append('avatar', avatarFile);
            }

            if (formData.newPassword) {
                if (formData.newPassword !== formData.confirmPassword) {
                    alert('Passwords do not match');
                    setSaving(false);
                    return;
                }
                data.append('currentPassword', formData.currentPassword);
                data.append('password', formData.newPassword);
            }

            const res = await api.put('/auth/profile', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update local storage with FULL response (includes new token)
            localStorage.setItem('user', JSON.stringify(res.data));

            alert('Profile updated successfully');
        } catch (err) {
            console.error(err);
            // REMOVED auto-logout per user request. Just show the error.
            /*
            if (err.response?.status === 401) {
                alert('Session expired. Please login again.');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            */
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                    <FaChevronLeft />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Account Settings</h1>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : (
                <Card>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #3a7bd5', marginBottom: '1rem' }}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#9ca3af' }}>
                                        <FaUser size={50} />
                                    </div>
                                )}
                            </div>
                            <label style={{ 
                                padding: '0.5rem 1rem', background: '#3a7bd5', color: 'white', 
                                borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' 
                            }}>
                                Change Photo
                                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                            </label>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <FaUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                                        borderRadius: '12px', border: '1px solid #e5e7eb',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <FaEnvelope style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
                                        borderRadius: '12px', border: '1px solid #e5e7eb',
                                        fontSize: '1rem', background: '#f3f4f6', color: '#9ca3af'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                style={{
                                    width: '100%', padding: '0.75rem 1rem',
                                    borderRadius: '12px', border: '1px solid #e5e7eb',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#111827' }}>Change Password</h3>
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.5rem' }}>Leave blank if you don't want to change it.</p>
                            
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem',
                                        borderRadius: '12px', border: '1px solid #e5e7eb',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem',
                                        borderRadius: '12px', border: '1px solid #e5e7eb',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%', padding: '0.75rem 1rem',
                                        borderRadius: '12px', border: '1px solid #e5e7eb',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                        </div>

                        <Button variant="primary" type="submit" fullWidth disabled={saving} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
                        </Button>
                    </form>
                </Card>
            )}
        </div>
    );
};

export default AccountSettings;
