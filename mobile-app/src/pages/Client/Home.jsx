import React, { useState, useEffect } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Toast from '../../components/UI/Toast';
import { useNavigate } from 'react-router-dom';
import { FaCrown, FaCalendarAlt, FaMapMarkerAlt, FaCommentDots, FaFileSignature, FaExchangeAlt, FaChevronDown } from 'react-icons/fa';
import api from '../../utils/api';

const Home = () => {
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);
    const [stats, setStats] = useState(null);
    const [selectedClubId, setSelectedClubId] = useState(localStorage.getItem('selectedClubId') || null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch basic dashboard stats (includes list of memberships and events)
                const statsResponse = await api.get('/dashboard/stats');

                // Consolidate data (backend now handles event filtering too)
                const combinedStats = statsResponse.data;

                setStats(combinedStats);

                // Set initial selection if needed
                if (combinedStats.myMemberships && combinedStats.myMemberships.length > 0) {
                    const activeClubs = combinedStats.myMemberships.filter(m => m.status === 'active');
                    // If no currently selected club or selection is invalid, default to first active
                    const currentSelectionValid = activeClubs.some(c => c.clubId === selectedClubId);

                    if (!selectedClubId || !currentSelectionValid) {
                        if (activeClubs.length > 0) {
                            handleClubChange(activeClubs[0].clubId);
                        } else if (combinedStats.myMemberships.length > 0) {
                            handleClubChange(combinedStats.myMemberships[0].clubId);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching home stats:', err);
                setToast({
                    message: err.response?.data?.message || 'Failed to load dashboard data',
                    type: 'error'
                });
            }
        };
        fetchStats();
    }, []);

    const handleClubChange = (clubId) => {
        setSelectedClubId(clubId);
        localStorage.setItem('selectedClubId', clubId);
    };

    const handleEventClick = (eventName) => {
        setToast({ message: `Registered interest for ${eventName}`, type: 'success' });
    };

    // Filter content based on selection
    const displayedMemberships = stats?.myMemberships?.filter(m => m.clubId === selectedClubId) || [];
    const displayedEvents = stats?.upcomingEvents?.filter(e => e.clubId?._id === selectedClubId || e.clubId === selectedClubId) || [];

    // Get currently selected club name for display
    const selectedClubName = stats?.myMemberships?.find(m => m.clubId === selectedClubId)?.clubName || 'My Club';

    // Available clubs list for dropdown
    const availableClubs = stats?.myMemberships || [];

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>Welcome Back,</h1>
                    <span style={{ fontSize: '1.5rem', color: '#3a7bd5', fontWeight: 'bold' }}>{user.name || 'User'}</span>
                </div>

                {availableClubs.length > 1 && (
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            background: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
                            fontWeight: 'bold', color: '#1e293b', border: '1px solid #e2e8f0'
                        }}>
                            <FaExchangeAlt color="#64748b" size={12} />
                            <select
                                value={selectedClubId || ''}
                                onChange={(e) => handleClubChange(e.target.value)}
                                style={{
                                    appearance: 'none', background: 'transparent', border: 'none',
                                    fontWeight: 'bold', color: '#1e293b', outline: 'none',
                                    paddingRight: '1rem', cursor: 'pointer'
                                }}
                            >
                                {availableClubs.map(club => (
                                    <option key={club.clubId} value={club.clubId}>{club.clubName}</option>
                                ))}
                            </select>
                            <FaChevronDown size={10} style={{ marginLeft: '-0.5rem', pointerEvents: 'none' }} />
                        </div>
                    </div>
                )}
            </header>

            <section style={{ marginBottom: '2rem' }}>
                {displayedMemberships.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {displayedMemberships.map((membership, idx) => (
                            <div key={idx} style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                                borderRadius: '20px',
                                padding: '1.5rem',
                                border: '1px solid rgba(0,0,0,0.1)',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
                            }}>
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', opacity: '0.05' }}><FaCrown /></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{membership.clubName}</span>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        background: membership.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                                        color: membership.status === 'active' ? '#059669' : '#64748b',
                                        borderRadius: '50px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {membership.status?.toUpperCase()}
                                    </span>
                                </div>

                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: '#1e293b', fontWeight: '800' }}>
                                    {membership.planName}
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {membership.clubLocation ? <><FaMapMarkerAlt size={12} /> {membership.clubLocation}</> : 'No Location Specified'}
                                </p>

                                {membership.planFeatures && membership.planFeatures.length > 0 && (
                                    <div style={{
                                        marginTop: '1.25rem',
                                        padding: '1rem',
                                        background: 'rgba(255,255,255,0.5)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(0,0,0,0.03)'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Membership Benefits:</div>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            {membership.planFeatures.slice(0, 3).map((feature, i) => (
                                                <li key={i} style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3a7bd5' }}></div>
                                                    {feature}
                                                </li>
                                            ))}
                                            {membership.planFeatures.length > 3 && (
                                                <li style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '1.1rem', fontStyle: 'italic' }}>
                                                    + {membership.planFeatures.length - 3} more exclusive benefits
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {membership.expiresAt && (
                                    <div style={{
                                        marginTop: '1rem', padding: '0.5rem 0.75rem', borderRadius: '10px',
                                        background: 'rgba(58, 123, 213, 0.05)', color: '#3a7bd5',
                                        fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px'
                                    }}>
                                        <FaCalendarAlt size={12} />
                                        Valid until: <strong>{new Date(membership.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                                    </div>
                                )}

                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem' }}>
                                    <Button variant="primary" fullWidth style={{ borderRadius: '14px', height: '2.8rem' }} onClick={() => setToast({ message: 'Digital ID copied', type: 'success' })}>ID Card</Button>
                                    <Button variant="secondary" fullWidth style={{ borderRadius: '14px', height: '2.8rem' }} onClick={() => navigate(`/client/clubs/${membership.clubId}`)}>Details</Button>
                                </div>
                                {(membership.status === 'expired' || membership.status === 'active' || membership.status === 'inactive' || membership.status === 'cancelled') && (
                                    <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => navigate(`/client/clubs/${membership.clubId}`)}
                                            style={{
                                                padding: '0.5rem', background: 'none', border: 'none',
                                                color: '#3a7bd5', fontWeight: '700', cursor: 'pointer',
                                                fontSize: '0.85rem', opacity: 0.8
                                            }}
                                        >
                                            {['expired', 'inactive', 'cancelled'].includes(membership.status) ? 'Renew Plan' : 'Manage Subscription'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        background: '#fff1f2',
                        borderRadius: '20px',
                        padding: '2rem',
                        textAlign: 'center',
                        border: '1px solid #fecdd3'
                    }}>
                        <div style={{ fontSize: '2rem', color: '#e11d48', marginBottom: '0.5rem' }}>⚠️</div>
                        <h3 style={{ fontSize: '1.2rem', color: '#be123c', marginBottom: '0.5rem' }}>
                            {selectedClubId ? 'Membership Inactive' : 'No Clubs Found'}
                        </h3>
                        <p style={{ color: '#881337', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {selectedClubId
                                ? 'You do not have an active membership for this club.'
                                : 'You currently do not have any active club memberships.'}
                        </p>
                        <Button
                            variant="primary"
                            onClick={() => selectedClubId ? navigate(`/client/clubs/${selectedClubId}`) : navigate('/client/explore')}
                        >
                            {selectedClubId ? 'View Membership Plans' : 'Explore Clubs'}
                        </Button>
                    </div>
                )}
            </section>

            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{selectedClubId ? 'Club Events' : 'My Club Events'}</h3>
                    {displayedEvents.length > 0 && (
                        <span
                            style={{ color: '#3a7bd5', fontSize: '0.9rem', cursor: 'pointer' }}
                            onClick={() => navigate('/client/events')}
                        >
                            View All
                        </span>
                    )}
                </div>

                {displayedEvents.length > 0 ? (
                    displayedEvents.map((event) => (
                        <Card key={event._id} onClick={() => handleEventClick(event.title)} style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{
                                    background: '#f1f5f9', borderRadius: '12px', padding: '0.75rem',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    minWidth: '60px'
                                }}>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>
                                        {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                    </span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                        {new Date(event.date).getDate()}
                                    </span>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{event.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                                        <FaMapMarkerAlt /> {event.location}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                        <FaCalendarAlt /> {event.time}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <p style={{ marginBottom: '1rem' }}>No upcoming events for {selectedClubName}.</p>
                        <Button variant="outline" size="small" onClick={() => navigate('/client/explore')}>Find More Clubs</Button>
                    </div>
                )}
            </section>

            <section style={{ marginTop: '2rem' }}>
                <Card
                    onClick={() => navigate('/client/feedback')}
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        padding: '1.5rem'
                    }}
                >
                    <div style={{
                        width: '50px',
                        height: '50px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FaCommentDots size={24} color="#00d2ff" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>How are we doing?</h4>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Share your feedback with {selectedClubName}</p>
                    </div>
                </Card>
            </section>

            <section style={{ marginTop: '1.5rem' }}>
                <Card
                    onClick={() => navigate('/client/intro-letter-request')}
                    style={{
                        background: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        padding: '1.5rem'
                    }}
                >
                    <div style={{
                        width: '50px',
                        height: '50px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FaFileSignature size={24} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Travel Abroad?</h4>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', margin: 0 }}>Request an introduction letter</p>
                    </div>
                </Card>
            </section>
        </div>
    );
};

export default Home;
