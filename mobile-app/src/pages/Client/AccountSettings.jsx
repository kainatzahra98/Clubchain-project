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
        phone: ''
    });

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
                    phone: res.data.phone || ''
                });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/auth/profile', {
                name: formData.name,
                phone: formData.phone
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
