import React, { useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Toast from '../../components/UI/Toast';
import { FaStar, FaPaperPlane, FaSmile, FaFrown, FaMeh } from 'react-icons/fa';
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

    const feedbackTypes = [
        { id: 'general', label: 'General' },
        { id: 'app_issue', label: 'App Issue' },
        { id: 'suggestion', label: 'Suggestion' },
        { id: 'complaint', label: 'Complaint' }
    ];

    // ... (rest of code) ...

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Fetch user's clubs on mount
    React.useEffect(() => {
        const fetchUserClubs = async () => {
            try {
                // Fetch user's joined clubs via new endpoint
                const response = await api.get('/members/my-clubs');
                // The endpoint returns memberships, so we extract the club details
                const clubs = response.data.map(m => m.clubId);
                setJoinedClubs(clubs);

                const storedClubId = localStorage.getItem('selectedClubId');

                // If stored ID is valid (in the user's club list), keep it.
                const isValidSelection = storedClubId && clubs.some(c => c._id === storedClubId);

                if (isValidSelection) {
                    setSelectedClubId(storedClubId);
                } else if (!selectedClubId || selectedClubId === 'general') {
                    // Only auto-select if nothing valid is currently selected
                    if (clubs.length === 1) {
                        setSelectedClubId(clubs[0]._id);
                    }
                    // Otherwise default to general or let user choose
                    else {
                        setSelectedClubId('general');
                    }
                }
            } catch (err) {
                console.error("Failed to fetch clubs", err);
            } finally {
                setIsLoadingClubs(false);
            }
        };
        fetchUserClubs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

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
            // If "general" is selected, send null for clubId
            const clubIdToSend = (!selectedClubId || selectedClubId === 'general') ? null : selectedClubId;

            await api.post('/feedback', {
                clubId: clubIdToSend,
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

            // Smart Reset: maintain current context if possible, otherwise default logic
            // If they were in a specific club context, keep it.
            // If they were in "General", keep it.
            // But if specific club list changed, re-evaluate.
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
        if (rating === 0) return <FaMeh />;
        if (rating <= 2) return <FaFrown className="sentiment-sad" />;
        if (rating >= 4) return <FaSmile className="sentiment-happy" />;
        return <FaMeh className="sentiment-neutral" />;
    };

    return (
        <div className="feedback-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header className="feedback-header">
                <h1>We Value Your Feedback</h1>
                <p>Help us improve your ClubChain experience</p>
            </header>

            <form onSubmit={handleSubmit}>
                <Card className="feedback-card">
                    {/* Club Selection Dropdown */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="section-label">Which club is this for? (Optional)</label>
                        <select
                            value={selectedClubId}
                            onChange={(e) => setSelectedClubId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                marginTop: '0.5rem',
                                fontSize: '1rem',
                                backgroundColor: '#fff'
                            }}
                        >
                            {joinedClubs.map(club => (
                                <option key={club._id} value={club._id}>
                                    {club.name}
                                </option>
                            ))}
                            <option value="general">General (No Specific Club)</option>
                        </select>
                        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
                            Select "General" if this feedback is for the app/platform itself.
                        </p>
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
                                {rating === 3 && 'Average'}
                                {rating === 4 && 'Good'}
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
