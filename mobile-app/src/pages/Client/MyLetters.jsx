import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { FaChevronLeft, FaDownload, FaQrcode, FaClock, FaCheckCircle, FaTimesCircle, FaEye } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { Browser } from '@capacitor/browser';

const MyLetters = () => {
    const navigate = useNavigate();
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLetter, setSelectedLetter] = useState(null); // For QR modal

    useEffect(() => {
        fetchLetters();
    }, []);

    const fetchLetters = async () => {
        try {
            const res = await api.get('/intro-letters/my');
            setLetters(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePdfAction = async (id, mode, e) => {
        e.stopPropagation();
        try {
            // Get user token for authentication via query param
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const token = user?.token;

            if (!token) {
                alert('Authentication error. Please login again.');
                return;
            }

            // Construct URL with query token
            // Ensure baseURL doesn't end with slash if path starts with one, or handle neatly
            const baseURL = api.defaults.baseURL || import.meta.env.VITE_API_URL || 'https://clubchain-backend.vercel.app/api';
            const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const url = `${cleanBaseURL}/intro-letters/${id}/download?token=${token}`;

            // Open in System Browser (handles PDF viewing and downloading)
            await Browser.open({ url });

        } catch (err) {
            console.error('Action failed', err);
            alert('Failed to open document. Please try again.');
        }
    };

    const getStatusParams = (status) => {
        switch (status) {
            case 'ACCEPTED': return { color: '#8b5cf6', icon: <FaCheckCircle />, bg: '#f5f3ff', label: 'ACCEPTED' };
            case 'APPROVED': return { color: '#10b981', icon: <FaCheckCircle />, bg: '#ecfdf5', label: 'APPROVED' };
            case 'REJECTED': return { color: '#ef4444', icon: <FaTimesCircle />, bg: '#fef2f2', label: 'REJECTED' };
            default: return { color: '#f59e0b', icon: <FaClock />, bg: '#fffbeb', label: 'PENDING' };
        }
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                        <FaChevronLeft />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>My Requests</h1>
                </div>
                <Button variant="secondary" onClick={() => navigate('/client/intro-letter-request')} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>+ New</Button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : letters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>No requests found.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {letters.map(letter => {
                        const statusStyle = getStatusParams(letter.status);
                        return (
                            <Card key={letter._id} onClick={() => letter.status === 'APPROVED' && setSelectedLetter(letter)} style={{ cursor: letter.status === 'APPROVED' ? 'pointer' : 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{letter.targetClubId?.name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0' }}> From: <span style={{ color: '#3b82f6', fontWeight: '500' }}>{letter.homeClubId?.name}</span></p>
                                        <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Visit Date: {new Date(letter.visitDate).toLocaleDateString()}</p>
                                    </div>
                                    <span style={{
                                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                                        background: statusStyle.bg, color: statusStyle.color,
                                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}>
                                        {statusStyle.icon} {statusStyle.label}
                                    </span>
                                </div>

                                {letter.status === 'REJECTED' && (
                                    <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        Reason: {letter.rejectionReason}
                                    </div>
                                )}

                                {letter.status === 'ACCEPTED' && (() => {
                                    const today = new Date();
                                    const expiry = new Date(letter.expiryDate);
                                    const visit = new Date(letter.visitDate);

                                    const totalTime = expiry.getTime() - visit.getTime();
                                    const totalDays = Math.max(1, Math.ceil(totalTime / (1000 * 3600 * 24)));

                                    const remainingTime = expiry.getTime() - today.getTime();
                                    const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 3600 * 24)));

                                    const isExpired = remainingDays === 0;

                                    return (
                                        <div style={{
                                            background: isExpired ? '#f3f4f6' : '#f0fdf4',
                                            border: `1px solid ${isExpired ? '#e5e7eb' : '#bbf7d0'}`,
                                            padding: '1rem', borderRadius: '12px', marginBottom: '1rem'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: isExpired ? '#6b7280' : '#15803d' }}>
                                                {isExpired ? <FaClock size={20} /> : <FaCheckCircle size={20} />}
                                                <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                                    {isExpired ? 'Visit Completed' : 'Visit Confirmed'}
                                                </span>
                                            </div>

                                            <p style={{ fontSize: '0.9rem', color: isExpired ? '#4b5563' : '#166534', margin: 0, lineHeight: '1.5', marginBottom: '0.75rem' }}>
                                                {isExpired
                                                    ? "This visit pass has expired. We hope you enjoyed your time!"
                                                    : <span>Your entry to <strong>{letter.targetClubId?.name}</strong> has been verified.</span>
                                                }
                                            </p>

                                            {isExpired ? (
                                                <Button
                                                    variant="primary"
                                                    fullWidth
                                                    onClick={(e) => { e.stopPropagation(); navigate('/client/intro-letter-request'); }}
                                                    style={{ marginTop: '0.5rem' }}
                                                >
                                                    Request Again
                                                </Button>
                                            ) : (
                                                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d' }}>{totalDays}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase' }}>Day Pass</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #bbf7d0' }}>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: remainingDays < 3 ? '#ef4444' : '#15803d' }}>{remainingDays}</div>
                                                        <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase' }}>Days Left</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {(letter.status === 'APPROVED' || letter.status === 'ACCEPTED') && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                        {/* Only show QR Code if NOT yet accepted (i.e. APPROVED) */}
                                        {letter.status === 'APPROVED' && (
                                            <Button variant="secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', minWidth: '100px' }}
                                                onClick={(e) => { e.stopPropagation(); setSelectedLetter(letter); }}
                                            >
                                                <FaQrcode /> QR Code
                                            </Button>
                                        )}

                                        <Button variant="outline" style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', minWidth: '100px' }}
                                            onClick={(e) => handlePdfAction(letter._id, 'view', e)}
                                        >
                                            <FaEye /> View Letter
                                        </Button>
                                        <Button variant="primary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', minWidth: '100px' }}
                                            onClick={(e) => handlePdfAction(letter._id, 'download', e)}
                                        >
                                            <FaDownload /> Save PDF
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* QR Modal */}
            {selectedLetter && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setSelectedLetter(null)}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', textAlign: 'center', maxWidth: '300px', width: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Entry Token</h3>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <QRCodeSVG value={selectedLetter.qrToken} size={200} level="H" />
                        </div>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Show this to the club reception</p>
                        <Button fullWidth onClick={() => setSelectedLetter(null)}>Close</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyLetters;
