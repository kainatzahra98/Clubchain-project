import React, { useState, useEffect } from 'react';
import Card from '../../components/UI/Card';
import { FaStar, FaSmile, FaFrown, FaFilter, FaCommentDots } from 'react-icons/fa';

import api from '../../utils/api';

const Feedback = () => {
    const [feedback, setFeedback] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await api.get('/feedback');
                setFeedback(res.data);
            } catch (error) {
                console.error('Failed to load feedback:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    const filteredFeedback = feedback.filter(item => {
        if (filter === 'all') return true;
        return item.sentiment === filter;
    });

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '#5ddc72';
            case 'negative': return '#ff6b6b';
            default: return '#5ddc72';
        }
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'positive': return <FaSmile />;
            case 'negative': return <FaFrown />;
            default: return <FaSmile />;
        }
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Member Feedback</h2>
                <p style={{ color: '#888' }}>Review what members are saying</p>
            </header>

            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['all', 'positive', 'negative'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '50px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: filter === f ? '#3a7bd5' : 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontSize: '0.8rem',
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading feedback...</div>
            ) : filteredFeedback.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#888' }}>
                    <FaCommentDots size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>No feedback found for this filter.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredFeedback.map((item) => (
                        <Card key={item._id} style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{item.userId?.name || 'Anonymous Member'}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                                        {new Date(item.submittedAt || item.createdAt).toLocaleDateString()} at {new Date(item.submittedAt || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: getSentimentColor(item.sentiment) }}>
                                    {getSentimentIcon(item.sentiment)}
                                    <div style={{ display: 'flex' }}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <FaStar key={s} size={10} color={s <= item.rating ? '#ffd700' : '#444'} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: '1.5', margin: 0 }}>
                                "{item.message}"
                            </p>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#3a7bd5', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                                {item.type.replace('-', ' ')}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Feedback;
