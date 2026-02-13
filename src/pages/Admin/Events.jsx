import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './Events.css';
import { FaPlus, FaSearch, FaMapMarkerAlt, FaClock, FaCalendarAlt, FaTrash, FaEdit } from 'react-icons/fa';
import api from '../../utils/api';

const Events = () => {
    const [events, setEvents] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [newEvent, setNewEvent] = React.useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        image: null,
        previewImage: '',
        status: 'published'
    });
    const [editingEventId, setEditingEventId] = React.useState(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [clubs, setClubs] = React.useState([]);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Helper to convert 24h time (native input) to 12h format (display/storage)
    const formatTimeTo12h = (time24) => {
        if (!time24) return '';
        if (time24.includes('AM') || time24.includes('PM')) return time24;
        const [hours, minutes] = time24.split(':');
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    };

    // Helper to convert 12h time (storage) back to 24h (native input)
    const formatTimeTo24h = (time12) => {
        if (!time12) return '';
        if (!time12.includes(' ')) return time12;
        const [time, ampm] = time12.split(' ');
        let [hours, minutes] = time.split(':');
        let h = parseInt(hours);
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${minutes}`;
    };

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            setEvents(response.data);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClubs = async () => {
        try {
            const response = await api.get('/clubs');
            setClubs(response.data);
            // Pre-select first club if adding new event
            if (!editingEventId && response.data.length > 0) {
                setNewEvent(prev => ({ ...prev, clubId: response.data[0]._id }));
            }
        } catch (err) {
            console.error('Error fetching clubs:', err);
        }
    };

    React.useEffect(() => {
        fetchEvents();
        if (user.role === 'SYSTEM_ADMIN') {
            fetchClubs();
        }
    }, []);

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await api.delete(`/events/${id}`);
                setEvents(events.filter(e => e._id !== id));
            } catch (err) {
                console.error('Error deleting event:', err);
                alert('Failed to delete event');
            }
        }
    };

    const handleEditEvent = (event) => {
        setNewEvent({
            title: event.title,
            description: event.description,
            date: event.date.split('T')[0],
            // Convert stored 12h format back to 24h for native input
            time: formatTimeTo24h(event.time),
            location: event.location,
            image: null,
            previewImage: event.image ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${event.image}` : '',
            status: event.status,
            clubId: event.clubId?._id || event.clubId
        });
        setEditingEventId(event._id);
        setShowCreateModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', newEvent.title);
            formData.append('description', newEvent.description);
            formData.append('date', newEvent.date);
            // Save time in 12h format as requested by user
            formData.append('time', formatTimeTo12h(newEvent.time));
            formData.append('location', newEvent.location);
            formData.append('status', newEvent.status);
            if (newEvent.image) {
                formData.append('image', newEvent.image);
            }

            if (newEvent.clubId) {
                formData.append('clubId', newEvent.clubId);
            } else if (user.clubId) {
                formData.append('clubId', user.clubId);
            }

            let response;
            if (editingEventId) {
                response = await api.put(`/events/${editingEventId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setEvents(events.map(ev => ev._id === editingEventId ? response.data : ev));
            } else {
                response = await api.post('/events', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setEvents([response.data, ...events]);
            }
            setShowCreateModal(false);
            setNewEvent({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                image: null,
                previewImage: '',
                status: 'published',
                clubId: clubs.length > 0 ? clubs[0]._id : ''
            });
            setEditingEventId(null);
        } catch (err) {
            console.error('Error saving event:', err);
            alert('Failed to save event');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setNewEvent({
            title: '',
            description: '',
            date: '',
            time: '',
            location: '',
            image: null,
            previewImage: '',
            status: 'published',
            clubId: clubs.length > 0 ? clubs[0]._id : (user.clubId || '')
        });
        setEditingEventId(null);
        setShowCreateModal(true);
    };

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName={user.role === 'SYSTEM_ADMIN' ? 'System Admin' : user.name} />

                <div className="dashboard-content">
                    <div className="content-container animate-slide-up">
                        <div className="events-header">
                            <div>
                                <h1>Events</h1>
                                <p>Manage your upcoming club events and gatherings.</p>
                            </div>
                            <button className="btn-add-new" onClick={openCreateModal}>
                                <FaPlus /> Create Event
                            </button>
                        </div>

                        <div className="management-controls glass" style={{ marginBottom: '2rem' }}>
                            <div className="search-bar">
                                <FaSearch />
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="events-grid">
                            {loading ? (
                                <div className="loading-state">Loading events...</div>
                            ) : filteredEvents.length === 0 ? (
                                <div className="empty-state">No events found matching your search.</div>
                            ) : filteredEvents.map((event) => (
                                <div key={event._id} className="event-card">
                                    <div className="event-image" style={{
                                        backgroundColor: '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#cbd5e1',
                                        backgroundImage: event.image ? `url(${import.meta.env.VITE_API_URL.replace('/api', '')}${event.image})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}>
                                        {!event.image && <FaCalendarAlt size={40} />}
                                        <div className="event-date-badge">
                                            <span className="month">{new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                                            <span className="day">{new Date(event.date).getDate()}</span>
                                        </div>
                                    </div>
                                    <div className="event-content">
                                        <div className="event-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3>{event.title}</h3>
                                            <div className="event-actions-mini" style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="icon-btn edit" title="Edit" onClick={() => handleEditEvent(event)}><FaEdit /></button>
                                                <button
                                                    className="icon-btn delete"
                                                    title="Delete"
                                                    onClick={() => handleDelete(event._id)}
                                                    style={{ color: '#ef4444' }}
                                                ><FaTrash /></button>
                                            </div>
                                        </div>
                                        <div className="event-meta">
                                            <span><FaMapMarkerAlt /> {event.location}</span>
                                            <span><FaClock /> {event.time}</span>
                                            {event.clubId && (
                                                <span style={{ color: '#3b82f6', fontWeight: '500' }}>
                                                    Club: {event.clubId.name || 'Unknown'}
                                                </span>
                                            )}
                                            {event.createdBy && (
                                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    By: {event.createdBy.name || 'Unknown'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="event-footer">
                                            <span className={`event-status ${event.status}`}>
                                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                            </span>
                                            <div className="attendees-count" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                                {event.attendeesCount || 0} Attendees
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Create Modal */}
                    {showCreateModal && (
                        <div className="modal-overlay">
                            <div className="modal-content premium-modal">
                                <div className="premium-modal-header">
                                    <h3>{editingEventId ? 'Edit Event' : 'Create New Event'}</h3>
                                    <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="input-group">
                                            <label>Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={newEvent.title}
                                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                                placeholder="Event Title"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Description</label>
                                            <textarea
                                                required
                                                value={newEvent.description}
                                                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                                placeholder="Event Description"
                                                rows="3"
                                            />
                                        </div>
                                        <div className="input-row">
                                            <div className="input-group">
                                                <label>Date</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={newEvent.date}
                                                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Time <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#64748b' }}>(Format: HH:MM AM/PM)</span></label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={newEvent.time}
                                                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        {user.role === 'SYSTEM_ADMIN' && (
                                            <div className="input-group">
                                                <label>Hosting Club</label>
                                                <select
                                                    value={newEvent.clubId}
                                                    onChange={(e) => setNewEvent({ ...newEvent, clubId: e.target.value })}
                                                    required
                                                    style={{ width: '100%', padding: '0.875rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                                                >
                                                    <option value="">Select a Club</option>
                                                    {clubs.map(club => (
                                                        <option key={club._id} value={club._id}>{club.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className="input-group">
                                            <label>Location</label>
                                            <input
                                                type="text"
                                                required
                                                value={newEvent.location}
                                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                                placeholder="Venue Name"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Event Image</label>
                                            <div className="file-input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            setNewEvent({
                                                                ...newEvent,
                                                                image: file,
                                                                previewImage: URL.createObjectURL(file)
                                                            });
                                                        }
                                                    }}
                                                    className="file-input"
                                                />
                                                {newEvent.previewImage && (
                                                    <div className="image-preview" style={{
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        height: '200px',
                                                        backgroundImage: `url(${newEvent.previewImage})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        border: '1px solid #e2e8f0'
                                                    }}></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>Status</label>
                                            <select
                                                value={newEvent.status}
                                                onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                                            >
                                                <option value="published">Published</option>
                                                <option value="draft">Draft</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                                            {isSubmitting ? 'Saving...' : (editingEventId ? 'Save Changes' : 'Publish Event')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Events;
