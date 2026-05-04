import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { FaUser, FaQuestionCircle, FaShieldAlt, FaSignOutAlt, FaCommentDots, FaUsers, FaFileAlt, FaCreditCard, FaChevronLeft } from 'react-icons/fa';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ name: 'Guest', role: 'Client' });
    const [stats, setStats] = useState({ clubsCount: 0, eventsCount: 0, points: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch User Details
            // Can get from localStorage first for speed
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) setUser(storedUser);

            // Fetch latest from API
            const userRes = await api.get('/auth/me');
            setUser(userRes.data);

            // Update local storage while preserving the token
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...userRes.data,
                token: currentUser.token // Persist original token
            }));

            // Fetch Stats
            const statsRes = await api.get('/members/stats');
            setStats(statsRes.data);

        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                    <FaChevronLeft />
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Profile</h2>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #eee 0%, #ccc 100%)',
                    margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    fontSize: '2.5rem', fontWeight: 'bold', color: '#333'
                }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>{user.name}</h2>
                <p style={{ color: '#aaa' }}>{user.role} Member</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                    <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 'bold' }}>{stats.eventsCount}</span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Events</span>
                </div>
                <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                    <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 'bold' }}>{stats.clubsCount}</span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Clubs</span>
                </div>
                <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                    <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 'bold' }}>{stats.points}</span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Points</span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Card style={{ padding: '0.5rem' }}>
                    <MenuItem icon={<FaUser />} label="Account Settings" onClick={() => navigate('/client/account-settings')} />
                    <MenuItem icon={<FaShieldAlt />} label="Privacy & Security" onClick={() => navigate('/client/privacy-security')} />
                    <MenuItem icon={<FaCreditCard />} label="Payment History" onClick={() => navigate('/client/payments')} />
                    <MenuItem icon={<FaUsers />} label="My Memberships" onClick={() => navigate('/client/my-memberships')} />
                    <MenuItem icon={<FaFileAlt />} label="My Requests" onClick={() => navigate('/client/my-letters')} />
                    <MenuItem icon={<FaCommentDots />} label="Send Feedback" onClick={() => navigate('/client/feedback')} />
                    <MenuItem icon={<FaQuestionCircle />} label="Help & Support" border={false} onClick={() => navigate('/client/help-center')} />
                </Card>

                <Button variant="danger" fullWidth style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={handleSignOut}>
                    <FaSignOutAlt /> Sign Out
                </Button>
            </div>
        </div>
    );
};

const MenuItem = ({ icon, label, border = true, onClick }) => (
    <div style={{
        padding: '1rem',
        borderBottom: border ? '1px solid rgba(0,0,0,0.05)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer'
    }} onClick={onClick}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280' }}>{icon}</span>
            <span style={{ fontWeight: '500' }}>{label}</span>
        </div>
        <span style={{ color: '#9ca3af' }}>&gt;</span>
    </div>
);

export default Profile;
