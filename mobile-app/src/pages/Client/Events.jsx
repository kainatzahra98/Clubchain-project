import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Toast from '../../components/UI/Toast';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import api from '../../utils/api';

const Events = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const selectedClubId = localStorage.getItem('selectedClubId');
                const params = {};

                if (selectedClubId) {
                    params.clubId = selectedClubId;
                }

                const response = await api.get('/events', { params });
                setEvents(response.data);
            } catch (err) {
                console.error('Error fetching events:', err);
                setToast({ message: 'Failed to load events', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleEventClick = (eventName) => {
        setToast({ message: `Registered interest for ${eventName}`, type: 'success' });
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '6rem' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Upcoming Events</h2>
                <div style={{ position: 'relative' }}>
                    <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.95rem',
                            outline: 'none'
                        }}
                    />
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading events...</div>
                ) : filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <Card key={event._id} onClick={() => handleEventClick(event.title)} style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ display: 'flex' }}>
                                <div style={{
                                    width: '80px',
                                    background: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    padding: '0.5rem'
                                }}>
                                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.9 }}>
                                        {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                    </span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                        {new Date(event.date).getDate()}
                                    </span>
                                </div>
                                <div style={{ padding: '1rem', flex: 1 }}>
                                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: '#1e293b' }}>{event.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                                        <FaMapMarkerAlt size={12} /> {event.location}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                        <FaCalendarAlt size={12} /> {event.time}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                        <p>No upcoming events found.</p>
                        <Button variant="outline" onClick={() => navigate('/client/explore')} style={{ marginTop: '1rem' }}>
                            Explore Clubs
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Events;
