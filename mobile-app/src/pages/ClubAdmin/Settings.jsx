import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Toast from '../../components/UI/Toast';
import { FaBuilding, FaUsersCog, FaBell, FaGlobe, FaSignOutAlt, FaHandshake, FaTimes, FaSearch, FaTrash, FaPlus, FaUserFriends, FaCheckCircle, FaClock, FaEye, FaPaperPlane, FaDownload } from 'react-icons/fa';
import { Browser } from '@capacitor/browser';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import api from '../../utils/api';

const Settings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [showAffiliateModal, setShowAffiliateModal] = useState(false);
    const [showVisitorsModal, setShowVisitorsModal] = useState(false);
    const [visitors, setVisitors] = useState([]);
    const [notifiedVisitors, setNotifiedVisitors] = useState([]); // List of letter IDs notified in this session
    const [notificationLoading, setNotificationLoading] = useState({}); // { letterId: boolean }
    const [affiliates, setAffiliates] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [pdfModal, setPdfModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        category: 'Health',
        location: ''
    });

    useEffect(() => {
        if (user.clubId) {
            fetchClubDetails(); // Fetch immediately to get prefs
        }
    }, [user.clubId]);

    useEffect(() => {
        if (showAffiliateModal && user.clubId) {
            fetchAffiliates();
        }
    }, [showAffiliateModal]);

    useEffect(() => {
        if (showVisitorsModal && user.clubId) {
            fetchVisitors();
        }
    }, [showVisitorsModal]);

    const fetchVisitors = async () => {
        setLoading(true);
        try {
            const res = await api.get('/intro-letters/incoming');
            setVisitors(res.data);
        } catch (err) {
            console.error(err);
            setToast({ message: 'Failed to load visitors', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleNotify = async (letterId) => {
        if (notificationLoading[letterId] || notifiedVisitors.includes(letterId)) return;

        setNotificationLoading(prev => ({ ...prev, [letterId]: true }));
        try {
            await api.post(`/intro-letters/${letterId}/notify-re-request`);
            setNotifiedVisitors(prev => [...prev, letterId]);
            setToast({ message: 'Notification sent successfully', type: 'success' });
        } catch (err) {
            console.error(err);
            setToast({ message: 'Failed to send notification', type: 'error' });
        } finally {
            setNotificationLoading(prev => ({ ...prev, [letterId]: false }));
        }
    };

    const handlePdfAction = async (id, mode = 'view', e) => {
        if (e) e.stopPropagation();
        try {
            const userStr = localStorage.getItem('user');
            const token = userStr ? JSON.parse(userStr)?.token : null;
            if (!token) return;

            const baseURL = api.defaults.baseURL || import.meta.env.VITE_API_URL || 'https://clubchain-backend.vercel.app/api';
            const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const pdfUrl = `${cleanBaseURL}/intro-letters/${id}/download?token=${token}&type=${mode}`;

            if (mode === 'view') {
                const response = await fetch(pdfUrl, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => setPdfModal(reader.result);
                reader.readAsDataURL(blob);
            } else {
                const response = await fetch(pdfUrl, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64data = reader.result;
                    try {
                        const fileName = `intro-letter-${id}.pdf`;
                        const result = await Filesystem.writeFile({
                            path: fileName,
                            data: base64data.split(',')[1],
                            directory: Directory.Cache,
                            recursive: true
                        });
                        setToast({ message: 'PDF processed successfully!', type: 'success' });
                        await Share.share({
                            title: 'Introduction Letter',
                            url: result.uri
                        });
                    } catch (err) {
                        const dataUrl = URL.createObjectURL(blob);
                        await Browser.open({ url: dataUrl });
                    }
                };
                reader.readAsDataURL(blob);
            }
        } catch (err) {
            console.error('PDF action failed:', err);
            setToast({ message: 'Failed to process document.', type: 'error' });
        }
    };

    const fetchClubDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/clubs/${user.clubId}`);
            const { name, description, category, location, notificationsEnabled } = response.data;
            setEditFormData({ name, description, category, location });
            setNotificationsEnabled(notificationsEnabled !== undefined ? notificationsEnabled : true);
        } catch (err) {
            console.error(err);
            setToast({ message: 'Failed to load club details', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/clubs/${user.clubId}`, editFormData);
            setToast({ message: 'Profile updated successfully', type: 'success' });
            setShowEditProfileModal(false);
        } catch (err) {
            console.error(err);
            setToast({ message: err.response?.data?.message || 'Failed to update profile', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationToggle = async () => {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue); // Optimistic update
        try {
            await api.put(`/clubs/${user.clubId}`, { notificationsEnabled: newValue });
            setToast({ message: `Notifications ${newValue ? 'enabled' : 'disabled'}`, type: 'success' });
        } catch (err) {
            console.error(err);
            setNotificationsEnabled(!newValue); // Revert
            setToast({ message: 'Failed to update preference', type: 'error' });
        }
    };

    const fetchAffiliates = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/clubs/${user.clubId}`);
            setAffiliates(response.data.affiliatedClubs || []);
        } catch (err) {
            console.error(err);
            setToast({ message: 'Failed to load affiliates', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setLoading(true);
        try {
            const response = await api.get('/clubs');
            // Filter client-side for now as generic search api might not exist
            const results = response.data.filter(c =>
                c._id !== user.clubId && // Exclude self
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !affiliates.some(a => a._id === c._id) // Exclude already affiliated
            );
            setSearchResults(results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addAffiliate = async (targetClubId) => {
        try {
            await api.post(`/clubs/${user.clubId}/affiliate`, { targetClubId });
            setToast({ message: 'Club affiliated successfully', type: 'success' });
            fetchAffiliates(); // Refresh list
            setSearchResults(prev => prev.filter(c => c._id !== targetClubId)); // Remove from results
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to add affiliate', type: 'error' });
        }
    };

    const removeAffiliate = async (targetDTO) => {
        try {
            // targetDTO is the club object or ID
            const targetId = targetDTO._id || targetDTO;
            await api.delete(`/clubs/${user.clubId}/affiliate/${targetId}`);
            setToast({ message: 'Affiliation removed', type: 'success' });
            fetchAffiliates();
        } catch (err) {
            setToast({ message: 'Failed to remove affiliate', type: 'error' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '6rem' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Settings</h2>
                <p style={{ color: '#888' }}>manage your club configuration</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Card style={{ padding: '0.5rem' }}>
                    <div onClick={() => setShowEditProfileModal(true)}>
                        <MenuItem icon={<FaBuilding />} label="Public Profile" border={true} />
                    </div>
                    {/* Staff Management Removed */}

                    <div onClick={() => setShowAffiliateModal(true)}>
                        <MenuItem icon={<FaHandshake />} label="Affiliated Clubs" border={true} />
                    </div>

                    <div onClick={() => setShowVisitorsModal(true)}>
                        <MenuItem icon={<FaUserFriends />} label="Visitor Management" border={true} />
                    </div>

                    <div onClick={handleNotificationToggle}>
                        <MenuItem
                            icon={<FaBell />}
                            label="Notification Preferences"
                            isToggle={true}
                            enabled={notificationsEnabled}
                        />
                    </div>
                </Card>

                <Button variant="danger" fullWidth onClick={handleLogout} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <FaSignOutAlt /> Sign Out
                </Button>
            </div>

            {/* Edit Profile Modal */}
            {showEditProfileModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '400px',
                        borderRadius: '20px', padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem' }}>Edit Public Profile</h3>
                            <FaTimes size={20} cursor="pointer" onClick={() => setShowEditProfileModal(false)} />
                        </div>

                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Club Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Category</label>
                                <select
                                    value={editFormData.category}
                                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}
                                >
                                    {['Health', 'Tech', 'Arts', 'Sports', 'Social', 'Professional'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Location</label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.location}
                                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Description</label>
                                <textarea
                                    required
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    rows="4"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit' }}
                                />
                            </div>

                            <Button type="submit" variant="primary" fullWidth disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* Affiliate Modal Overlay */}
            {showAffiliateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '400px',
                        borderRadius: '20px', padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem' }}>Manage Affiliates</h3>
                            <FaTimes size={20} cursor="pointer" onClick={() => setShowAffiliateModal(false)} />
                        </div>

                        {/* Search Section */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                placeholder="Find clubs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <Button variant="primary" onClick={handleSearch} disabled={loading}><FaSearch /></Button>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>Appealing Clubs</h4>
                                {searchResults.map(club => (
                                    <div key={club._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                                        <span style={{ fontWeight: 'bold' }}>{club.name}</span>
                                        <Button variant="outline" size="small" onClick={() => addAffiliate(club._id)}><FaPlus /></Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Current Affiliates */}
                        <div>
                            <h4 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '0.5rem' }}>Current Affiliates</h4>
                            {affiliates.length === 0 ? (
                                <p style={{ color: '#aaa', fontSize: '0.9rem', fontStyle: 'italic' }}>No affiliates yet.</p>
                            ) : (
                                affiliates.map(club => (
                                    <div key={club._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{club.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{club.location}</div>
                                        </div>
                                        <Button variant="danger" size="small" onClick={() => removeAffiliate(club)}><FaTrash /></Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Visitor Management Modal */}
            {showVisitorsModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '400px',
                        borderRadius: '20px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem' }}>Visitor Management</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Current & Past Visitors</p>
                            </div>
                            <FaTimes size={20} style={{ cursor: 'pointer' }} onClick={() => setShowVisitorsModal(false)} />
                        </div>

                        {loading && visitors.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                        ) : visitors.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}>No visitors found.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {visitors.map(visitor => {
                                    const isExpired = visitor.status === 'EXPIRED' || (visitor.expiryDate && new Date(visitor.expiryDate) < new Date());
                                    const planName = visitor.membership?.planId?.title || 'Unknown Plan';

                                    return (
                                        <div key={visitor._id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '12px', background: isExpired ? '#f8f9fa' : 'white' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                        {visitor.memberId?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold' }}>{visitor.memberId?.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#6366f1' }}>{planName}</div>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                                                    background: isExpired ? '#fee2e2' : '#dcfce7',
                                                    color: isExpired ? '#dc2626' : '#15803d'
                                                }}>
                                                    {isExpired ? 'EXPIRED' : visitor.status}
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <FaClock size={12} />
                                                    <span>Visit: {new Date(visitor.visitDate).toLocaleDateString()} ({visitor.duration} days)</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <FaClock size={12} />
                                                    <span>Expires: {new Date(visitor.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handlePdfAction(visitor._id, 'view', e)}
                                                    style={{
                                                        flex: 1, padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem',
                                                        cursor: 'pointer', outline: 'none'
                                                    }}
                                                    onMouseDown={(e) => e.currentTarget.style.opacity = '0.7'}
                                                    onMouseUp={(e) => e.currentTarget.style.opacity = '1'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    <FaEye /> View
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handlePdfAction(visitor._id, 'download', e)}
                                                    style={{
                                                        flex: 1, padding: '0.6rem 0.5rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem',
                                                        cursor: 'pointer', outline: 'none'
                                                    }}
                                                    onMouseDown={(e) => e.currentTarget.style.opacity = '0.7'}
                                                    onMouseUp={(e) => e.currentTarget.style.opacity = '1'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                >
                                                    <FaDownload /> Save
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={notificationLoading[visitor._id] || notifiedVisitors.includes(visitor._id)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleNotify(visitor._id);
                                                    }}
                                                    style={{
                                                        flex: 1.5, padding: '0.6rem 0.5rem', borderRadius: '8px', border: 'none',
                                                        background: notifiedVisitors.includes(visitor._id) ? '#dcfce7' : '#6366f1',
                                                        color: notifiedVisitors.includes(visitor._id) ? '#15803d' : 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem',
                                                        cursor: notifiedVisitors.includes(visitor._id) ? 'default' : 'pointer',
                                                        outline: 'none',
                                                        fontWeight: '600',
                                                        transition: 'all 0.2s ease',
                                                        opacity: notificationLoading[visitor._id] ? 0.7 : 1
                                                    }}
                                                    onMouseDown={(e) => {
                                                        if (!notifiedVisitors.includes(visitor._id)) e.currentTarget.style.transform = 'scale(0.95)';
                                                    }}
                                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    {notificationLoading[visitor._id] ? (
                                                        'Sending...'
                                                    ) : notifiedVisitors.includes(visitor._id) ? (
                                                        <><FaCheckCircle size={14} /> Notified</>
                                                    ) : (
                                                        <><FaPaperPlane size={14} /> {isExpired ? 'Notify Re-request' : 'Notify Soon'}</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {pdfModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001
                }} onClick={() => setPdfModal(null)}>
                    <div style={{
                        background: 'white', borderRadius: '16px', width: '95%', maxWidth: '800px', height: '90vh',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Introduction Letter</h3>
                            <button onClick={() => setPdfModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem' }}>✖</button>
                        </div>
                        {Capacitor.isNativePlatform() && (
                            <div style={{ padding: '0.5rem 1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                                <Button size="small" variant="outline" onClick={async () => {
                                    if (!pdfModal) return;
                                    try {
                                        const base64 = pdfModal.split(',')[1];
                                        const saved = await Filesystem.writeFile({
                                            path: 'view-letter.pdf',
                                            data: base64,
                                            directory: Directory.Cache
                                        });
                                        await Share.share({ title: 'Letter', url: saved.uri });
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }}>Open with System Viewer</Button>
                            </div>
                        )}
                        <div style={{ flex: 1, background: '#f3f4f6' }}>
                            <iframe src={pdfModal} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF" />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

const MenuItem = ({ icon, label, border = true, isToggle = false, enabled = false }) => {
    return (
        <div style={{
            padding: '1rem',
            borderBottom: border ? '1px solid rgba(255,255,255,0.1)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#aaa' }}>{icon}</span>
                <span>{label}</span>
            </div>
            {isToggle ? (
                <div style={{ width: '40px', height: '20px', background: enabled ? '#5ddc72' : '#555', borderRadius: '20px', position: 'relative', transition: 'background 0.3s' }}>
                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: enabled ? '22px' : '2px', transition: 'left 0.3s' }}></div>
                </div>
            ) : (
                <span style={{ color: '#444' }}>&gt;</span>
            )}
        </div>
    );
};

export default Settings;
