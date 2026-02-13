import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { FaChevronLeft, FaMapMarkerAlt, FaSignOutAlt, FaExclamationTriangle } from 'react-icons/fa';

const MyMemberships = () => {
    const navigate = useNavigate();
    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchMemberships();
    }, []);

    const fetchMemberships = async () => {
        try {
            const res = await api.get('/members/my-clubs');
            console.log('MyMemberships Data Received:', res.data);
            // Backend now returns Membership objects: [{ clubId: {...}, planId: {...}, status, expiresAt }]
            setMemberships(res.data);
        } catch (err) {
            console.error(err);
            setToast({
                message: err.response?.data?.message || 'Failed to load memberships',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveClub = async (clubId, clubName) => {
        if (!window.confirm(`Are you sure you want to unsubscribe from ${clubName}?`)) {
            return;
        }

        try {
            await api.put(`/members/${clubId}/deactivate`);
            setToast({ message: `Successfully unsubscribed from ${clubName}`, type: 'success' });
            fetchMemberships();
        } catch (err) {
            console.error(err);
            setToast({ message: err.response?.data?.message || 'Failed to deactivate membership', type: 'error' });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                    <FaChevronLeft />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>My Memberships</h1>
            </div>

            {toast && (
                <div style={{
                    padding: '1rem', marginBottom: '1rem', borderRadius: '8px',
                    backgroundColor: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: toast.type === 'error' ? '#b91c1c' : '#15803d',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.9rem'
                }}>
                    {toast.type === 'error' ? <FaExclamationTriangle /> : null}
                    {toast.message}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : memberships.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <p>You don't have any active memberships.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="primary" onClick={() => navigate('/client/explore')}>
                            Explore Clubs
                        </Button>
                        <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>Trouble loading? Try resetting your session:</p>
                        <Button
                            variant="secondary"
                            style={{ background: 'rgba(0,0,0,0.05)', color: '#64748b', fontSize: '0.8rem' }}
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = '/login';
                            }}
                        >
                            Hard Reset Session
                        </Button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {memberships.map(membership => {
                        const club = membership.clubId;
                        const plan = membership.planId;

                        return (
                            <Card key={membership._id} style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '60px', height: '60px', borderRadius: '12px',
                                        background: club.image ? `url(${club.image}) center/cover` : '#e2e8f0',
                                        flexShrink: 0
                                    }}></div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#1e293b' }}>{club.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem' }}>
                                            <FaMapMarkerAlt style={{ fontSize: '0.75rem' }} /> {club.location}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            backgroundColor: membership.status === 'active' ? '#dcfce7' : '#fee2e2',
                                            color: membership.status === 'active' ? '#166534' : '#991b1b',
                                            textTransform: 'capitalize'
                                        }}>
                                            {membership.status}
                                        </span>
                                    </div>
                                </div>

                                <div style={{
                                    background: '#f8fafc',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    marginBottom: '1rem',
                                    border: '1px solid #f1f5f9'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Plan:</span>
                                        <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155' }}>{plan?.title || 'Custom Plan'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Expires:</span>
                                        <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155' }}>{formatDate(membership.expiresAt)}</span>
                                    </div>

                                    {plan?.features && plan.features.length > 0 && (
                                        <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed #e2e8f0' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan Benefits:</div>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                {plan.features.slice(0, 3).map((f, i) => (
                                                    <li key={i} style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0ea5e9' }}></div>
                                                        {f}
                                                    </li>
                                                ))}
                                                {plan.features.length > 3 && <li style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>+ {plan.features.length - 3} more benefits</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => navigate(`/client/clubs/${club._id}`)}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: '14px',
                                            background: '#f8fafc', border: '1px solid #e2e8f0',
                                            color: '#1e293b', fontWeight: 'bold', fontSize: '0.9rem',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', textAlign: 'center'
                                        }}
                                    >
                                        Update / Upgrade
                                    </button>
                                    <button
                                        onClick={() => handleLeaveClub(club._id, club.name)}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: '14px',
                                            background: '#fff1f2', border: '1px solid #fecdd3',
                                            color: '#e11d48', fontWeight: 'bold', fontSize: '0.9rem',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        <FaSignOutAlt size={14} /> Unsubscribe
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyMemberships;
