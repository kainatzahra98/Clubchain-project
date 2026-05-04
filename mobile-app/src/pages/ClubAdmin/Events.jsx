import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Toast from '../../components/UI/Toast';
import api from '../../utils/api';
import { FaCalendarAlt, FaMapMarkerAlt, FaPlus, FaTrash, FaEdit, FaTimes, FaSearch, FaChevronLeft } from 'react-icons/fa';

const Events = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: ''
    });

    // Redirect if not logged in
    useEffect(() => {
        if (!user || !user.token) {
            navigate('/login');
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));
            // Controller handles clubId filtering automatically for CLUB_ADMIN
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (error) {
            console.error('Failed to load events:', error);
            setToast({ message: 'Failed to load events', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        if (e.target.type === 'file') {
            setFormData({ ...formData, image: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('date', formData.date);
            data.append('time', formData.time);
            data.append('location', formData.location);
            if (formData.image) {
                data.append('image', formData.image);
            }

            // Note: simple POST/PUT with FormData automatically sets Content-Type to multipart/form-data
            if (isEditing) {
                await api.put(`/events/${currentEventId}`, data);
                setToast({ message: 'Event updated successfully!', type: 'success' });
            } else {
                await api.post('/events', data);
                setToast({ message: 'Event created successfully!', type: 'success' });
            }
            setShowModal(false);
            resetForm();
            fetchEvents();
        } catch (error) {
            console.error(error);
            setToast({ message: error.response?.data?.message || 'Operation failed', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            setToast({ message: 'Event deleted', type: 'success' });
            fetchEvents();
        } catch (error) {
            console.error(error);
            setToast({ message: 'Failed to delete event', type: 'error' });
        }
    };

    const openEditModal = (event) => {
        setIsEditing(true);
        setCurrentEventId(event._id);
        setFormData({
            title: event.title,
            description: event.description,
            date: new Date(event.date).toISOString().split('T')[0],
            time: event.time,
            location: event.location
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            date: '',
            time: '',
            location: ''
        });
        setIsEditing(false);
        setCurrentEventId(null);
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '6rem' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                        <FaChevronLeft />
                    </button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Manage Events</h2>
                </div>
                <Button onClick={() => { resetForm(); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                    <FaPlus /> Add Event
                </Button>
            </header>

            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3rem',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        outline: 'none'
                    }}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading events...</div>
            ) : filteredEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280', background: '#f9fafb', borderRadius: '16px' }}>
                    <p>No events found. Create one!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredEvents.map((event) => (
                        <Card key={event._id} style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ display: 'flex' }}>
                                <div style={{
                                    width: '80px',
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: '#1f2937', fontWeight: 'bold' }}>{event.title}</h4>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => openEditModal(event)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><FaEdit /></button>
                                            <button onClick={() => handleDelete(event._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FaTrash /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
                                        <FaMapMarkerAlt size={12} /> {event.location}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                        <FaCalendarAlt size={12} /> {event.time}
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {event.description}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{isEditing ? 'Edit Event' : 'New Event'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}><FaTimes /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Event Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Time</label>
                                    <input
                                        type="time"
                                        name="time"
                                        value={formData.time}
                                        onChange={handleInputChange}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g. Main Hall or 123 Club St"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Event Image (Optional)</label>
                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem', background: 'white' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows="4"
                                    placeholder="What's this event about?"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '1rem', fontFamily: 'inherit' }}
                                />
                            </div>

                            <Button variant="primary" fullWidth type="submit" style={{ marginTop: '0.5rem' }}>
                                {isEditing ? 'Save Changes' : 'Create Event'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
