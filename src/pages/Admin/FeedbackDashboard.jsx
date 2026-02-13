import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './FeedbackDashboard.css';
import {
    FaExclamationTriangle,
    FaSmile,
    FaMeh,
    FaFrown,
    FaCheckCircle,
    FaFilter,
    FaClock,
    FaTrash,
    FaUserTag,
    FaTimes
} from 'react-icons/fa';
import api from '../../utils/api';

const FeedbackDashboard = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [filterSentiment, setFilterSentiment] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [showTrash, setShowTrash] = useState(false);

    // Assign Modal State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [selectedAssignee, setSelectedAssignee] = useState('');

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchFeedback = async () => {
        try {
            const response = await api.get(`/feedback${showTrash ? '?status=deleted' : ''}`);
            setFeedbackList(response.data);

            if (!showTrash) {
                // Check for new negative feedback
                const pendingNegative = response.data.filter(f => f.sentiment === 'negative' && f.status === 'pending');
                if (pendingNegative.length > 0) {
                    setShowAlert(true);
                }
            }
        } catch (err) {
            console.error('Error fetching feedback:', err);
        }
    };

    const fetchAdmins = async () => {
        try {
            const response = await api.get('/auth/admins');
            setAdmins(response.data);
        } catch (err) {
            console.error('Error fetching admins:', err);
        }
    };

    useEffect(() => {
        fetchFeedback();
        fetchAdmins();
        // Poll for new feedback every 10 seconds
        const interval = setInterval(fetchFeedback, 10000);
        return () => clearInterval(interval);
    }, [showTrash]); // Re-fetch when switching to/from Trash

    const handleMarkResolved = async (id) => {
        try {
            await api.put(`/feedback/${id}`, { status: 'resolved' });

            // Update state locally
            const updatedList = feedbackList.map(f =>
                f._id === id ? { ...f, status: 'resolved' } : f
            );
            setFeedbackList(updatedList);

            // AUTO-DISMISS ALERT: 
            // If no more PENDING negative feedback exists, hide the alert
            const remainingNegativePending = updatedList.filter(f => f.sentiment === 'negative' && f.status === 'pending');
            if (remainingNegativePending.length === 0) {
                setShowAlert(false);
            }
        } catch (err) {
            console.error('Error resolving feedback:', err);
            alert('Failed to resolve feedback');
        }
    };

    const handleAssign = (id) => {
        setSelectedFeedbackId(id);
        setShowAssignModal(true);
    };

    const confirmAssignment = async () => {
        if (!selectedAssignee) {
            alert('Please select an assignee');
            return;
        }

        try {
            const response = await api.put(`/feedback/${selectedFeedbackId}`, {
                assignedTo: selectedAssignee
            });

            // Update state with populated data from backend
            setFeedbackList(feedbackList.map(f =>
                f._id === selectedFeedbackId ? response.data : f
            ));

            setShowAssignModal(false);
            setSelectedFeedbackId(null);
            setSelectedAssignee('');
        } catch (err) {
            console.error('Error assigning feedback:', err);
            alert('Failed to assign feedback');
        }
    };

    const handleNotifyAgain = async (id) => {
        try {
            await api.post(`/feedback/${id}/notify`);
            alert('Assignee has been notified again!');
        } catch (err) {
            console.error('Error notifying assignee:', err);
            alert('Failed to notify assignee');
        }
    };

    const handleRestore = async (id) => {
        try {
            await api.put(`/feedback/${id}/restore`);
            fetchFeedback();
        } catch (err) {
            console.error('Error restoring feedback:', err);
        }
    };

    const handlePermanentDelete = async (id) => {
        if (window.confirm('PERMANENTLY DELETE this feedback? This cannot be undone.')) {
            try {
                await api.delete(`/feedback/${id}/permanent`);
                fetchFeedback();
            } catch (err) {
                console.error('Error permanent deleting feedback:', err);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            try {
                await api.delete(`/feedback/${id}`);
                // Re-fetch to ensure stats are correct
                fetchFeedback();
            } catch (err) {
                console.error('Error deleting feedback:', err);
            }
        }
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'positive': return <FaSmile className="sentiment-icon positive" />;
            case 'negative': return <FaFrown className="sentiment-icon negative" />;
            default: return <FaMeh className="sentiment-icon neutral" />;
        }
    };

    const getSentimentBadgeClass = (sentiment) => {
        return `sentiment-badge ${sentiment}`;
    };

    const getTypeEmoji = (type) => {
        switch (type) {
            case 'bug': return '🐛';
            case 'feature': return '✨';
            case 'complaint': return '⚠️';
            case 'praise': return '💖';
            default: return '💬';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'bug': return 'Bug Report';
            case 'feature': return 'Feature Request';
            case 'complaint': return 'Complaint';
            case 'praise': return 'Praise / Merit';
            default: return 'General';
        }
    };

    // Filter feedback
    const filteredFeedback = feedbackList.filter(f => {
        const matchesSentiment = filterSentiment === 'all' || f.sentiment === filterSentiment;
        const matchesType = filterType === 'all' || f.type === filterType;
        const matchesStatus = filterStatus === 'all' || f.status === filterStatus;

        const userName = f.userId?.name || f.submittedBy || 'Anonymous';
        const matchesSearch = f.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userName.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSentiment && matchesType && matchesStatus && matchesSearch;
    });

    const negativeCount = feedbackList.filter(f => f.sentiment === 'negative' && f.status === 'pending').length;
    const stats = {
        total: feedbackList.length,
        positive: feedbackList.filter(f => f.sentiment === 'positive').length,
        neutral: feedbackList.filter(f => f.sentiment === 'neutral').length,
        negative: feedbackList.filter(f => f.sentiment === 'negative').length,
        pending: feedbackList.filter(f => f.status === 'pending').length
    };

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName={user.name || "Admin"} />

                <div className="dashboard-content">
                    <div className="content-container">
                        <header className="dashboard-header">
                            <div className="header-with-action">
                                <div>
                                    <h1>{showTrash ? 'Feedback Trash Bin' : 'Feedback Dashboard'}</h1>
                                    <p>{showTrash ? 'Manage and restore deleted feedback' : 'Monitor and respond to customer feedback'}</p>
                                </div>
                                <button
                                    className={`trash-toggle-btn ${showTrash ? 'active' : ''}`}
                                    onClick={() => setShowTrash(!showTrash)}
                                >
                                    <FaTrash /> {showTrash ? 'Back to Dashboard' : 'View Trash Bin'}
                                </button>
                            </div>
                        </header>

                        {/* Alert Banner for Negative Feedback */}
                        {showAlert && negativeCount > 0 && (
                            <div className="alert-banner negative-alert">
                                <div className="alert-content">
                                    <FaExclamationTriangle className="alert-icon" />
                                    <div>
                                        <strong>Action Required!</strong>
                                        <p>You have {negativeCount} unresolved negative feedback {negativeCount === 1 ? 'item' : 'items'} that need attention.</p>
                                    </div>
                                </div>
                                <button className="dismiss-btn" onClick={() => setShowAlert(false)}>Dismiss</button>
                            </div>
                        )}

                        {/* Stats Grid */}
                        <div className="feedback-stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon blue">📊</div>
                                <div className="stat-info">
                                    <span className="stat-label">Total Feedback</span>
                                    <h3>{stats.total}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green">😊</div>
                                <div className="stat-info">
                                    <span className="stat-label">Positive</span>
                                    <h3>{stats.positive}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon yellow">😐</div>
                                <div className="stat-info">
                                    <span className="stat-label">Neutral</span>
                                    <h3>{stats.neutral}</h3>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon red">😞</div>
                                <div className="stat-info">
                                    <span className="stat-label">Negative</span>
                                    <h3>{stats.negative}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="filters-section">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Search feedback..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="filter-group">
                                <FaFilter className="filter-icon" />
                                <select value={filterSentiment} onChange={(e) => setFilterSentiment(e.target.value)}>
                                    <option value="all">All Sentiments</option>
                                    <option value="positive">Positive</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="negative">Negative</option>
                                </select>

                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                    <option value="all">All Types</option>
                                    <option value="bug">Bug Report</option>
                                    <option value="feature">Feature Request</option>
                                    <option value="general">General</option>
                                    <option value="complaint">Complaint</option>
                                    <option value="praise">Praise</option>
                                </select>

                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                        </div>

                        {/* Feedback List */}
                        <div className="feedback-list">
                            {filteredFeedback.length === 0 ? (
                                <div className="empty-state">
                                    <FaMeh style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }} />
                                    <p>No feedback found</p>
                                </div>
                            ) : (
                                filteredFeedback.map((feedback) => (
                                    <div
                                        key={feedback._id}
                                        className={`feedback-item ${feedback.sentiment === 'negative' ? 'highlight-negative' : ''}`}
                                    >
                                        <div className="feedback-header-row">
                                            <div className="user-info">
                                                <div className="user-avatar">{(feedback.userId?.name || feedback.submittedBy || 'U').charAt(0)}</div>
                                                <div>
                                                    <h4>{feedback.userId?.name || feedback.submittedBy || 'User'}</h4>
                                                    <span className="feedback-date">
                                                        <FaClock /> {new Date(feedback.submittedAt).toLocaleDateString()} at {new Date(feedback.submittedAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="feedback-meta">
                                                {feedback.clubId ? (
                                                    <span className="club-badge" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        {feedback.clubId.name}
                                                    </span>
                                                ) : (
                                                    <span className="club-badge" style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        General Platform
                                                    </span>
                                                )}
                                                {feedback.assignedTo && (
                                                    <span className="assigned-badge">
                                                        <FaUserTag /> {feedback.assignedTo.name}
                                                    </span>
                                                )}
                                                <span className={getSentimentBadgeClass(feedback.sentiment)}>
                                                    {getSentimentIcon(feedback.sentiment)}
                                                    {feedback.sentiment}
                                                </span>
                                                {feedback.sentimentScore === 0 && (
                                                    <span className="sentiment-warning" title="AI Model was offline. This is a default label.">
                                                        <FaExclamationTriangle /> Fallback
                                                    </span>
                                                )}
                                                <span className="type-badge">
                                                    {getTypeEmoji(feedback.type)} {getTypeLabel(feedback.type)}
                                                </span>
                                                <span className={`status-badge ${feedback.status}`}>
                                                    {feedback.status === 'resolved' ? <FaCheckCircle /> : <FaClock />}
                                                    {feedback.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="feedback-rating">
                                            Rating: {'⭐'.repeat(feedback.rating)} ({feedback.rating}/5)
                                        </div>

                                        <div className="feedback-message">
                                            {feedback.message}
                                        </div>

                                        <div className="feedback-actions">
                                            {showTrash ? (
                                                <>
                                                    <button
                                                        className="action-btn resolve"
                                                        onClick={() => handleRestore(feedback._id)}
                                                    >
                                                        <FaClock /> Restore
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handlePermanentDelete(feedback._id)}
                                                    >
                                                        <FaTrash /> Permanent Delete
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {feedback.status === 'pending' && (
                                                        (() => {
                                                            const isActionable = feedback.type === 'complaint' || feedback.type === 'feature' || feedback.sentiment === 'negative';
                                                            return (
                                                                <button
                                                                    className={`action-btn ${isActionable ? 'resolve' : 'mark-read'}`}
                                                                    onClick={() => handleMarkResolved(feedback._id)}
                                                                >
                                                                    <FaCheckCircle /> {isActionable ? 'Resolve' : 'Mark as Read'}
                                                                </button>
                                                            );
                                                        })()
                                                    )}

                                                    {/* Assign Button: Only for Actionable items that are pending and unassigned */}
                                                    {feedback.status === 'pending' && !feedback.assignedTo && (
                                                        (feedback.type === 'complaint' || feedback.type === 'feature' || feedback.sentiment === 'negative') && (
                                                            <button
                                                                className="action-btn assign"
                                                                onClick={() => handleAssign(feedback._id)}
                                                            >
                                                                <FaUserTag /> Assign
                                                            </button>
                                                        )
                                                    )}

                                                    {/* Notify Again: Only for assigned pending actionable items (System Admin only) */}
                                                    {feedback.status === 'pending' && feedback.assignedTo && user.role === 'SYSTEM_ADMIN' && (
                                                        (feedback.type === 'complaint' || feedback.type === 'feature' || feedback.sentiment === 'negative') && (
                                                            <button
                                                                className="action-btn notify"
                                                                onClick={() => handleNotifyAgain(feedback._id)}
                                                            >
                                                                <FaExclamationTriangle /> Notify Again
                                                            </button>
                                                        )
                                                    )}

                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(feedback._id)}
                                                    >
                                                        <FaTrash /> Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Assign Modal */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-modal" style={{ maxWidth: '500px' }}>
                        <div className="premium-modal-header">
                            <div className="header-icon-box">
                                <FaUserTag className="header-icon" />
                            </div>
                            <div className="header-text">
                                <h3>Assign Feedback</h3>
                                <p>Select a qualified resolver for this issue</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowAssignModal(false)}><FaTimes /></button>
                        </div>

                        <div className="modal-body-lush">
                            <div className="assign-form-container">
                                <div className="input-group-premium">
                                    <label><FaFilter /> Assignee Category</label>
                                    <div className="select-wrapper">
                                        <select
                                            className="premium-select"
                                            value={selectedAssignee}
                                            onChange={(e) => setSelectedAssignee(e.target.value)}
                                        >
                                            <option value="">Select a team member...</option>
                                            <option value={user.id}>Me ({user.name})</option>

                                            <optgroup label="System Administration">
                                                {admins.filter(a => a._id !== user.id && a.role === 'SYSTEM_ADMIN').map(admin => (
                                                    <option key={admin._id} value={admin._id}>
                                                        {admin.name} (Direct)
                                                    </option>
                                                ))}
                                            </optgroup>

                                            <optgroup label="Internal Support Team">
                                                {admins.filter(a => a.role === 'SUPPORT_TEAM').map(admin => (
                                                    <option key={admin._id} value={admin._id}>
                                                        {admin.name} (Support)
                                                    </option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>
                                <div className="info-bar">
                                    <FaExclamationTriangle />
                                    <span>Assigning will instantly notify the member via their task dashboard.</span>
                                </div>
                            </div>
                        </div>

                        <div className="premium-modal-footer">
                            <button className="btn-cancel-lush" onClick={() => setShowAssignModal(false)}>Cancel</button>
                            <button
                                className="btn-save-lush"
                                onClick={confirmAssignment}
                                disabled={!selectedAssignee}
                            >
                                <FaCheckCircle /> Confirm & Notify
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackDashboard;
