import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { FaUsers, FaClipboardList, FaChartLine, FaCog, FaGem, FaCommentDots, FaQrcode } from 'react-icons/fa';
import api from '../../utils/api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.clubId) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#333' }}>Welcome, {user.name}!</h2>
                <p style={{ color: '#666', marginBottom: '2rem' }}>You haven't created a club yet.</p>
                <div style={{ padding: '2rem', background: '#f0f9ff', borderRadius: '20px', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '3rem' }}>🏰</span>
                </div>
                <Button variant="primary" onClick={() => navigate('/club-admin/create-club')}>
                    Create Your Club Profile
                </Button>
            </div>
        );
    }

    const [clubInfo, setClubInfo] = useState(null);
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch club info to check status
                if (user.clubId) {
                    const clubRes = await api.get(`/clubs/${user.clubId._id || user.clubId}`);
                    setClubInfo(clubRes.data);
                }

                const response = await api.get('/dashboard/stats');
                setStatsData(response.data);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    if (clubInfo && (clubInfo.status === 'pending' || clubInfo.status === 'inactive')) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#333' }}>Activation Pending!</h2>
                <div style={{ padding: '2rem', background: '#fffbeb', borderRadius: '20px', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '3rem' }}>⏳</span>
                </div>
                <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Your club profile for <strong>{clubInfo.name}</strong> has been submitted to the System Admin for approval.
                </p>
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#475569' }}>Next Steps:</h4>
                    <ul style={{ color: '#64748b', fontSize: '0.9rem', paddingLeft: '1.2rem' }}>
                        <li>Admin reviews your application</li>
                        <li>You'll get a notification upon activation</li>
                        <li>Complete your plans & events once live</li>
                    </ul>
                </div>
                <Button variant="secondary" style={{ marginTop: '2rem' }} onClick={() => window.location.reload()}>
                    Check Status
                </Button>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Club Dashboard</h2>
                <p style={{ color: '#888' }}>Welcome back, <span style={{ color: '#3a7bd5' }}>{user.name || 'Admin'}</span></p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00d2ff', marginBottom: '0.25rem' }}>
                        {loading ? '...' : (statsData?.totalUsers || statsData?.totalMembers || '0')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Total Members</div>
                </Card>
                <Card style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffd700', marginBottom: '0.25rem' }}>
                        {loading ? '...' : (statsData?.pendingTasks || '0')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Pending Req</div>
                </Card>
            </div>

            <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Button variant="secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }} onClick={() => navigate('/club-admin/members')}>
                        <FaUsers size={20} color="#3a7bd5" />
                        <span style={{ fontSize: '0.9rem' }}>View Members</span>
                    </Button>
                    <Button variant="secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }} onClick={() => navigate('/club-admin/tasks')}>
                        <FaClipboardList size={20} color="#00d2ff" />
                        <span style={{ fontSize: '0.9rem' }}>Review Tasks</span>
                    </Button>
                    <Button variant="secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }} onClick={() => navigate('/club-admin/membership-plans')}>
                        <FaGem size={20} color="#a855f7" />
                        <span style={{ fontSize: '0.9rem' }}>Plans</span>
                    </Button>
                    <Button variant="secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }} onClick={() => navigate('/club-admin/feedback')}>
                        <FaCommentDots size={20} color="#ec4899" />
                        <span style={{ fontSize: '0.9rem' }}>Feedback</span>
                    </Button>
                    <Button variant="secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }} onClick={() => navigate('/club-admin/scan-qr')}>
                        <FaQrcode size={20} color="#333" />
                        <span style={{ fontSize: '0.9rem' }}>Scan QR</span>
                    </Button>
                    <Button variant="secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }} onClick={() => navigate('/club-admin/edit-club')}>
                        <FaCog size={20} color="#64748b" />
                        <span style={{ fontSize: '0.9rem' }}>Edit Profile</span>
                    </Button>
                </div>
            </section>

            <section>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recent Performance</h3>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: '#aaa' }}>Recent Feedback</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{statsData?.recentFeedbackCount || '0'} New</span>
                        </div>
                        <FaChartLine size={24} color="#5ddc72" />
                    </div>
                </Card>
            </section>
        </div>
    );
};

export default Dashboard;
