import React, { useState, useEffect } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { FaChevronLeft, FaDownload, FaQrcode, FaClock, FaCheckCircle, FaTimesCircle, FaEye, FaTimes, FaChevronRight, FaTrash } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

// ─────────────────────────────────────────────────────────────────────────────
// Main MyLetters Page
// ─────────────────────────────────────────────────────────────────────────────
const MyLetters = () => {
    const navigate = useNavigate();
    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLetter, setSelectedLetter] = useState(null); // For QR modal
    const [viewLoadingId, setViewLoadingId] = useState(null);  // tracks which letter is being viewed
    const [saveLoadingId, setSaveLoadingId] = useState(null);  // tracks which letter is being saved
    const [pdfModal, setPdfModal] = useState(null); // For PDF viewer modal

    useEffect(() => {
        fetchLetters();
    }, []);

    const fetchLetters = async () => {
        try {
            const res = await api.get('/intro-letters/my');
            const data = res.data || [];
            console.log('[DEBUG] Raw letters count:', data.length);

            // Sort: PENDING first, then APPROVED, then by newest date
            const sortedLetters = [...data].sort((a, b) => {
                const getPriority = (s) => {
                    if (s === 'PENDING') return 0;
                    if (s === 'APPROVED') return 1;
                    return 2;
                };
                const pA = getPriority(a.status);
                const pB = getPriority(b.status);
                
                if (pA !== pB) return pA - pB;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            console.log('[DEBUG] Sorted letters (first 3 status):', sortedLetters.slice(0, 3).map(l => l.status));
            setLetters(sortedLetters);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLetter = async (id, e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        if (!window.confirm('Are you sure you want to delete this request? This will remove it from your history and cancel any pending approvals.')) {
            return;
        }

        try {
            await api.delete(`/intro-letters/${id}`);
            setLetters(prev => prev.filter(l => l._id !== id));
        } catch (err) {
            console.error('Delete letter failed:', err);
            alert('Failed to delete request: ' + (err.response?.data?.message || err.message));
        }
    };

    // Shared: fetch PDF binary and return base64 data URL + blob
    const fetchPdfBase64 = async (id) => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const token = user?.token || null;
        if (!token) throw new Error('Session expired. Please login again.');

        const baseURL = api.defaults.baseURL || import.meta.env.VITE_API_URL || 'https://clubchain-backend.vercel.app/api';
        const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
        const apiUrl = `${cleanBaseURL}/intro-letters/${id}/download?type=view`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ dataUrl: reader.result, blob });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // VIEW LETTER — On native, save and share; on web, use modal
    const handleViewLetter = async (letter, e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        if (viewLoadingId || saveLoadingId) return;
        setViewLoadingId(letter._id);
        try {
            console.log('Fetching PDF for letter:', letter._id);
            
            if (Capacitor.isNativePlatform()) {
                // For native, we save to cache and use Share which allows viewing/opening
                const { dataUrl } = await fetchPdfBase64(letter._id);
                const fileName = `view-letter-${letter._id}.pdf`;
                const base64Only = dataUrl.split(',')[1];

                const saved = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Only,
                    directory: Directory.Cache,
                    recursive: true,
                });
                
                await Share.share({
                    title: 'View Introduction Letter',
                    url: saved.uri,
                    dialogTitle: 'Open PDF',
                });
            } else {
                // Web: Use the iframe modal
                const response = await api.get(`/intro-letters/${letter._id}/download`, {
                    responseType: 'blob'
                });
                
                const dataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(response.data);
                });
                
                setPdfModal(dataUrl);
            }
        } catch (err) {
            console.error('View letter failed:', err);
            alert('Could not open the letter: ' + err.message);
        } finally {
            setViewLoadingId(null);
        }
    };

    // SAVE PDF — save to Cache directory (most compatible with Android permissions)
    const handleSavePdf = async (letter, e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        if (viewLoadingId || saveLoadingId) return;
        setSaveLoadingId(letter._id);
        try {
            const { dataUrl } = await fetchPdfBase64(letter._id);
            const fileName = `intro-letter-${letter._id}.pdf`;
            const base64Only = dataUrl.split(',')[1];

            if (!Capacitor.isNativePlatform()) {
                // Web: trigger browser download
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                alert('PDF download started!');
            } else {
                // Native: save to Cache directory (safest for EACCES)
                const saved = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Only,
                    directory: Directory.Cache,
                    recursive: true,
                });
                console.log('PDF saved to Cache:', saved.uri);
                
                // On native, sharing is the best way to let user "save" it to their device or view it
                await Share.share({
                    title: 'Introduction Letter',
                    text: 'My ClubChain Introduction Letter',
                    url: saved.uri,
                    dialogTitle: 'Save or Open PDF',
                });
            }
        } catch (err) {
            console.error('Save PDF failed:', err);
            alert('Could not process the PDF: ' + err.message);
        } finally {
            setSaveLoadingId(null);
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
                            <Card key={letter._id} style={{ cursor: 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{letter.targetClubId?.name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0' }}> From: <span style={{ color: '#3b82f6', fontWeight: '500' }}>{letter.homeClubId?.name}</span></p>
                                        <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Visit Date: {new Date(letter.visitDate).toLocaleDateString()}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                                            background: statusStyle.bg, color: statusStyle.color,
                                            padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold'
                                        }}>
                                            {statusStyle.icon} {statusStyle.label}
                                        </span>
                                        <button 
                                            onClick={(e) => handleDeleteLetter(letter._id, e)}
                                            style={{ 
                                                background: 'none', border: 'none', color: '#ef4444', 
                                                fontSize: '0.9rem', cursor: 'pointer', padding: '0.25rem',
                                                display: 'flex', alignItems: 'center', gap: '0.25rem'
                                            }}
                                            title="Delete Request"
                                        >
                                            <FaTrash size={12} /> <span style={{ fontSize: '0.75rem' }}>Delete</span>
                                        </button>
                                    </div>
                                </div>

                                {letter.status === 'REJECTED' && (
                                    <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        Reason: {letter.rejectionReason}
                                    </div>
                                )}

                                {letter.status === 'ACCEPTED' && (() => {
                                    const today = new Date();
                                    const expiry = new Date(letter.expiryDate);
                                    const started = letter.visitStartedAt ? new Date(letter.visitStartedAt) : new Date(letter.visitDate);

                                    const totalTime = expiry.getTime() - started.getTime();
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
                                                    {isExpired ? 'Visit Completed' : (letter.visitStartedAt ? 'Visit Active' : 'Visit Confirmed')}
                                                </span>
                                            </div>

                                            <p style={{ fontSize: '0.9rem', color: isExpired ? '#4b5563' : '#166534', margin: 0, lineHeight: '1.5', marginBottom: '0.75rem' }}>
                                                {isExpired
                                                    ? "This visit pass has expired. We hope you enjoyed your time!"
                                                    : letter.visitStartedAt
                                                        ? <span>Your visit at <strong>{letter.targetClubId?.name}</strong> has started! Enjoy your stay.</span>
                                                        : <span>Your entry to <strong>{letter.targetClubId?.name}</strong> has been verified and is ready to start.</span>
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
                                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d' }}>
                                                            {letter.visitStartedAt
                                                                ? Math.max(0, totalDays - remainingDays)
                                                                : new Date(letter.visitDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase' }}>
                                                            {letter.visitStartedAt ? 'Days Passed' : 'Visit Date'}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid #bbf7d0' }}>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: remainingDays < 2 ? '#ef4444' : '#15803d' }}>
                                                            {letter.visitStartedAt ? remainingDays : totalDays}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase' }}>
                                                            {letter.visitStartedAt ? 'Days Left' : 'Duration (Days)'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {letter.visitStartedAt && !isExpired && (
                                                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#15803d', textAlign: 'center' }}>
                                                    Started on: {new Date(letter.visitStartedAt).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {(letter.status === 'APPROVED' || letter.status === 'ACCEPTED') && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                                        {letter.status === 'APPROVED' && (
                                            <Button
                                                variant="secondary"
                                                style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', minWidth: '100px' }}
                                                onClick={(e) => { e.stopPropagation(); setSelectedLetter(letter); }}
                                            >
                                                <FaQrcode /> QR Code
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', minWidth: '100px', opacity: viewLoadingId === letter._id ? 0.6 : 1 }}
                                            onClick={(e) => handleViewLetter(letter, e)}
                                            disabled={viewLoadingId === letter._id || saveLoadingId === letter._id}
                                        >
                                            <FaEye /> {viewLoadingId === letter._id ? 'Loading…' : 'View Letter'}
                                        </Button>

                                        <Button
                                            variant="primary"
                                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', minWidth: '100px', opacity: saveLoadingId === letter._id ? 0.6 : 1 }}
                                            onClick={(e) => handleSavePdf(letter, e)}
                                            disabled={viewLoadingId === letter._id || saveLoadingId === letter._id}
                                        >
                                            <FaDownload /> {saveLoadingId === letter._id ? 'Saving…' : 'Save PDF'}
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

            {/* PDF Viewer Modal */}
            {pdfModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001
                }} onClick={() => setPdfModal(null)}>
                    <div style={{ 
                        background: 'white', 
                        borderRadius: '16px', 
                        width: '95%', 
                        maxWidth: '800px', 
                        height: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ 
                            padding: '1rem', 
                            borderBottom: '1px solid #e5e7eb', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                        }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Introduction Letter</h3>
                            <Button 
                                variant="outline" 
                                onClick={() => setPdfModal(null)}
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                <FaTimes /> Close
                            </Button>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                            <iframe 
                                src={pdfModal} 
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    border: 'none',
                                    minHeight: '500px'
                                }}
                                title="PDF Viewer"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyLetters;
