import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Toast from '../../components/UI/Toast';
import { FaStar, FaPaperPlane, FaSmile, FaFrown, FaChevronLeft, FaChevronDown } from 'react-icons/fa';
import api from '../../utils/api';
import './Feedback.css';

const Feedback = () => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackType, setFeedbackType] = useState('general');
    const [message, setMessage] = useState('');
    const [toast, setToast] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New state for club selection
    const [joinedClubs, setJoinedClubs] = useState([]);
    const [selectedClubId, setSelectedClubId] = useState(localStorage.getItem('selectedClubId') || '');
    const [isLoadingClubs, setIsLoadingClubs] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const feedbackTypes = [
        { id: 'general', label: 'General' },
        { id: 'bug', label: 'App Issue / Bug' },
        { id: 'feature', label: 'Feature Suggestion' },
        { id: 'complaint', label: 'Complaint' }
    ];

    // ... (rest of code) ...

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch member's specific clubs on mount for feedback selection
    React.useEffect(() => {
        const fetchMemberClubs = async () => {
            try {
                console.log("🔍 Fetching member's joined and visited clubs for feedback...");
                console.log("👤 User info:", user);
                console.log("🔑 User token:", user.token ? "exists" : "missing");
                
                // Get member's joined and visited clubs to allow feedback for those clubs
                const response = await api.get('/members/my-clubs');
                console.log("📡 Clubs response status:", response.status);
                console.log("📡 Clubs response data:", response.data);
                const clubs = response.data || [];
                console.log("📊 Clubs data length:", clubs.length);
                console.log("📊 First club sample:", clubs[0]);
                setJoinedClubs(clubs);
                console.log("✅ Set clubs for feedback:", clubs);

                const storedClubId = localStorage.getItem('selectedClubId');

                // If stored ID is valid (in the member's club list), keep it.
                const isValidSelection = storedClubId && clubs.some(c => c._id === storedClubId);

                if (isValidSelection) {
                    setSelectedClubId(storedClubId);
                } else {
                    // Default to first club if available, or empty string
                    setSelectedClubId(clubs.length > 0 ? clubs[0]._id : '');
                }
            } catch (err) {
                console.error("❌ Failed to fetch member clubs", err);
                console.error("❌ Error details:", err.response?.data, err.response?.status);
                console.error("❌ Error message:", err.message);
                // If member-specific endpoint fails, show message but don't fallback to all clubs
                setJoinedClubs([]);
            } finally {
                setIsLoadingClubs(false);
            }
        };
        fetchMemberClubs();
    }, []);

    // Debug render state
    console.log("🔍 Feedback render state:", {
        joinedClubsLength: joinedClubs.length,
        isLoadingClubs,
        selectedClubId
    });

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedClubId || selectedClubId === 'general') {
            setToast({ message: 'Please select a club to leave feedback', type: 'error' });
            return;
        }

        if (rating === 0) {
            setToast({ message: 'Please select a rating', type: 'error' });
            return;
        }

        if (!message.trim()) {
            setToast({ message: 'Please enter your feedback', type: 'error' });
            return;
        }

        setIsSubmitting(true);

        try {
            await api.post('/feedback', {
                clubId: selectedClubId,
                rating,
                message,
                type: feedbackType
            });

            setToast({
                message: 'Thank you! Your feedback has been submitted successfully.',
                type: 'success'
            });

            // Reset form
            setRating(0);
            setMessage('');
            setFeedbackType('general');

            // Redirect to Explore after 1.5 seconds to see results
            setTimeout(() => {
                navigate('/client/explore');
            }, 1500);

            // Smart Reset: maintain current context if possible, otherwise default logic
            if (joinedClubs.length === 1) setSelectedClubId(joinedClubs[0]._id);
            // else keep current selection (which might be 'general' or a specific club)

        } catch (err) {
            console.error('Feedback Submission Error:', err);
            setToast({
                message: err.response?.data?.message || 'Failed to submit feedback. Please try again.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSentimentIcon = () => {
        if (rating === 0) return <FaSmile style={{ opacity: 0.2 }} />;
        if (rating <= 2) return <FaFrown className="sentiment-sad" />;
        return <FaSmile className="sentiment-happy" />;
    };

    const selectedClub = joinedClubs.find(c => c.clubId?._id === selectedClubId || c._id === selectedClubId);

    const getStatusLabel = (status) => {
        if (status === 'active') return 'Member';
        if (status === 'visitor') return 'Visitor';
        if (status === 'expired' || status === 'EXPIRED') return 'Past Visit';
        return status;
    };

    const getStatusClass = (status) => {
        if (status === 'active') return 'member';
        if (status === 'visitor') return 'visitor';
        return 'past';
    };

    return (
        <div className="feedback-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header className="feedback-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                        <FaChevronLeft />
                    </button>
                    <h1 style={{ margin: 0 }}>We Value Your Feedback</h1>
                </div>
                <p>Help us improve your ClubChain experience</p>
            </header>

            <form onSubmit={handleSubmit}>
                <Card className="feedback-card">
                    {/* Premium Custom Club Selector */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="section-label">Which club is this for?</label>
                        {isLoadingClubs ? (
                            <div className="club-selector-trigger">
                                <span className="selected-club-placeholder">Loading clubs...</span>
                            </div>
                        ) : (
                            <div className="club-selector-container">
                                <div 
                                    className={`club-selector-trigger ${isDropdownOpen ? 'open' : ''}`}
                                    onClick={() => joinedClubs.length > 0 && setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="selected-club-info">
                                        {selectedClub ? (
                                            <>
                                                <span className="selected-club-name">{selectedClub.clubId?.name || selectedClub.name}</span>
                                                <span className={`status-badge ${getStatusClass(selectedClub.status)}`}>
                                                    {getStatusLabel(selectedClub.status)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="selected-club-placeholder">Select a club</span>
                                        )}
                                    </div>
                                    <FaChevronDown className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
                                </div>

                                {isDropdownOpen && (
                                    <div className="club-options-dropdown">
                                        {joinedClubs.length === 0 ? (
                                            <div className="club-option" style={{ cursor: 'default' }}>
                                                <span className="club-option-name" style={{ color: '#94a3b8' }}>No clubs available</span>
                                            </div>
                                        ) : (
                                            joinedClubs.map(club => {
                                                const cid = club.clubId?._id || club._id;
                                                return (
                                                    <div 
                                                        key={cid} 
                                                        className={`club-option ${selectedClubId === cid ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setSelectedClubId(cid);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                    >
                                                        <div className="club-option-info">
                                                            <span className="club-option-name">{club.clubId?.name || club.name}</span>
                                                            <span className="club-option-location">{club.clubId?.location || club.location}</span>
                                                        </div>
                                                        <span className={`status-badge ${getStatusClass(club.status)}`}>
                                                            {getStatusLabel(club.status)}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {isDropdownOpen && (
                                    <div 
                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }} 
                                        onClick={() => setIsDropdownOpen(false)} 
                                    />
                                )}
                                
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', fontWeight: '500' }}>
                                    {joinedClubs.length === 0 
                                        ? "You haven't joined or visited any clubs yet." 
                                        : `Found ${joinedClubs.length} club(s) you've joined or visited.`
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="rating-section">
                        <label className="section-label">How would you rate your experience?</label>
                        <div className="rating-container">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                >
                                    <FaStar />
                                </button>
                            ))}
                        </div>
                        <div className="sentiment-indicator">
                            {getSentimentIcon()}
                            <span>
                                {rating === 0 && 'Select a rating'}
                                {rating === 1 && 'Very Poor'}
                                {rating === 2 && 'Poor'}
                                {rating === 3 && 'Good'}
                                {rating === 4 && 'Very Good'}
                                {rating === 5 && 'Excellent'}
                            </span>
                        </div>
                    </div>
                </Card>

                <Card className="feedback-card">
                    <label className="section-label">Feedback Type</label>
                    <div className="feedback-type-grid">
                        {feedbackTypes.map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                className={`type-btn ${feedbackType === type.id ? 'active' : ''}`}
                                onClick={() => setFeedbackType(type.id)}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </Card>

                <Card className="feedback-card">
                    <label className="section-label">Your Message</label>
                    <textarea
                        className="feedback-textarea"
                        placeholder="Tell us more about your experience..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                    />
                    <div className="char-count">
                        {message.length} / 1000 characters
                    </div>
                </Card>

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={isSubmitting}
                    style={{
                        marginBottom: '5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {isSubmitting ? (
                        <>Submitting...</>
                    ) : (
                        <>
                            <FaPaperPlane /> Submit Feedback
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
};

export default Feedback;
