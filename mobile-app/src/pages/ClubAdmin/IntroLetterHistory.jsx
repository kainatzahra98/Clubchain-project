import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHistory, FaCheck, FaTimes, FaClock, FaUser, FaBuilding, FaInfoCircle } from 'react-icons/fa';
import Card from '../../components/UI/Card';
import api from '../../utils/api';

const IntroLetterHistory = () => {
    const navigate = useNavigate();
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user || !user.token) {
            navigate('/login');
            return;
        }
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/intro-letters/processed');
            setLetters(res.data);
        } catch (error) {
            console.error('Failed to fetch intro letter history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const s = status ? status.toUpperCase() : 'PENDING';
        let style = { bg: '#fffbeb', color: '#f59e0b', icon: <FaClock /> };
        if (s === 'APPROVED' || s === 'COMPLETED' || s === 'ACCEPTED') 
            style = { bg: '#ecfdf5', color: '#10b981', icon: <FaCheck /> };
        if (s === 'REJECTED') 
            style = { bg: '#fef2f2', color: '#ef4444', icon: <FaTimes /> };
        if (s === 'EXPIRED') 
            style = { bg: '#f1f5f9', color: '#64748b', icon: <FaClock /> };

        return (
            <span style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: style.bg, color: style.color,
                padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 'bold'
            }}>
                {style.icon} {s}
            </span>
        );
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem' }}
                >
                    <FaArrowLeft />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Approval History</h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>History of letters you have processed</p>
                </div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading history...</div>
            ) : letters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#f8fafc', borderRadius: '20px' }}>
                    <FaHistory size={48} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
                    <p style={{ color: '#94a3b8' }}>No processed letters found.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {letters.map((letter) => {
                        const isOutbound = letter.homeClubId?._id === user.clubId;
                        const otherClub = isOutbound ? letter.targetClubId : letter.homeClubId;

                        return (
                            <Card key={letter._id} style={{ border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '40px', height: '40px', borderRadius: '10px', 
                                            background: isOutbound ? '#eef2ff' : '#ecfdf5', 
                                            color: isOutbound ? '#6366f1' : '#10b981',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                                        }}>
                                            {isOutbound ? <FaUser size={18} /> : <FaUser size={18} />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: isOutbound ? '#6366f1' : '#10b981', textTransform: 'uppercase' }}>
                                                {isOutbound ? 'Member Outbound' : 'Visitor Inbound'}
                                            </div>
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.1rem' }}>
                                                {letter.memberId?.name || 'Unknown Member'}
                                            </h4>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                Processed: {new Date(letter.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    {getStatusBadge(letter.status)}
                                </div>

                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', marginBottom: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#475569', fontSize: '0.85rem' }}>
                                        <FaBuilding size={14} />
                                        <span>{isOutbound ? 'Visiting:' : 'From:'} <strong>{otherClub?.name || 'Affiliated Club'}</strong></span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem' }}>
                                        <FaClock size={14} />
                                        <span>Visit Date: {new Date(letter.visitDate).toLocaleDateString()}</span>
                                    </div>
                                    {letter.purpose && (
                                        <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem', fontStyle: 'italic', color: '#64748b', fontSize: '0.8rem' }}>
                                            "{letter.purpose}"
                                        </div>
                                    )}
                                </div>

                            {letter.status === 'REJECTED' && letter.rejectionReason && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '10px', marginTop: '0.5rem' }}>
                                    <FaInfoCircle color="#ef4444" style={{ marginTop: '0.1rem' }} />
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.1rem' }}>Rejection Reason:</div>
                                        <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>{letter.rejectionReason}</div>
                                    </div>
                                </div>
                            )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default IntroLetterHistory;
