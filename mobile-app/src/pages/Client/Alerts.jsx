import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import { FaBell, FaCalendarCheck, FaInfoCircle, FaExclamationCircle, FaChevronLeft } from 'react-icons/fa';
import api from '../../utils/api';

const Alerts = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const selectedClubId = localStorage.getItem('selectedClubId');

    useEffect(() => {
        fetchNotifications();

        // Polling for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [location.pathname]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter notifications: Show System/General types OR Club-specific ones matching selection
    const filteredNotifications = notifications.filter(note => {
        // Always show system, info, alert, and success types regardless of club context
        // These are critical account/visit status updates
        if (['system', 'info', 'alert', 'success'].includes(note.type)) return true;

        // For other contextual notifications (like 'event'), filter by selected club if present
        if (!selectedClubId) return true;

        if (note.relatedId) {
            const relatedIdStr = typeof note.relatedId === 'object' ? note.relatedId._id : note.relatedId;
            return relatedIdStr === selectedClubId;
        }

        return true;
    });

    const handleRead = async (id, isRead) => {
        if (!isRead) {
            try {
                await api.put(`/notifications/${id}/read`);
                // Update local state
                setNotifications(notifications.map(n =>
                    n._id === id ? { ...n, isRead: true } : n
                ));
            } catch (err) {
                console.error('Error marking as read', err);
            }
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'event': return <FaCalendarCheck color="#00d2ff" />;
            case 'alert': return <FaExclamationCircle color="#e11d48" />;
            case 'system': return <FaInfoCircle color="#3a7bd5" />;
            default: return <FaBell color="#ffd700" />;
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                        <FaChevronLeft />
                    </button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Notifications</h2>
                </div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</div>
            ) : filteredNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                    <p>No notifications for this club context.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredNotifications.map((note) => (
                        <Card
                            key={note._id}
                            onClick={() => handleRead(note._id, note.isRead)}
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'flex-start',
                                opacity: note.isRead ? 0.6 : 1,
                                background: note.isRead ? '#f8fafc' : 'white',
                                transition: 'opacity 0.3s ease',
                                borderLeft: note.isRead ? 'none' : '4px solid #3a7bd5'
                            }}
                        >
                            <div style={{
                                background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.75rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                {getIcon(note.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: note.isRead ? 'normal' : 'bold', color: '#1e293b' }}>{note.title}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{getTimeAgo(note.createdAt)}</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.4' }}>{note.message}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Alerts;
