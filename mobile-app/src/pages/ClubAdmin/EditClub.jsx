import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { FaChevronLeft, FaSave } from 'react-icons/fa';

const EditClub = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Health',
        location: '',
        affiliatedClubs: []
    });
    const [availableClubs, setAvailableClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categories = ['Health', 'Tech', 'Arts', 'Sports', 'Social', 'Professional'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get current club details
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const clubId = user.clubId?._id || user.clubId;

                if (!clubId) {
                    setError('No club associated with your account.');
                    setLoading(false);
                    return;
                }

                const [clubRes, allClubsRes] = await Promise.all([
                    api.get(`/clubs/${clubId}`),
                    api.get('/clubs')
                ]);

                console.log("[DEBUG] Current Club ID:", clubId);
                console.log("[DEBUG] All Clubs count:", allClubsRes.data.length);

                const clubData = clubRes.data;
                setFormData({
                    name: clubData.name || '',
                    description: clubData.description || '',
                    category: clubData.category || 'Health',
                    location: clubData.location || '',
                    affiliatedClubs: (clubData.affiliatedClubs || []).map(c => String(c._id || c))
                });

                // 2. Filter available clubs for affiliation (only active ones, except self)
                const activeOtherClubs = allClubsRes.data.filter(c =>
                    c.status === 'active' && String(c._id) !== String(clubId)
                );
                console.log("[DEBUG] Filtered Active Other Clubs:", activeOtherClubs.length);
                setAvailableClubs(activeOtherClubs);

            } catch (err) {
                console.error("Failed to fetch club data", err);
                setError('Failed to load club information.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const clubId = user.clubId?._id || user.clubId;

            await api.put(`/clubs/${clubId}`, formData);
            setSuccess('Club profile updated successfully!');
            setTimeout(() => navigate('/club-admin'), 1500);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to update club');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleAffiliate = (clubId) => {
        setFormData(prev => {
            const isSelected = prev.affiliatedClubs.includes(clubId);
            if (isSelected) {
                return { ...prev, affiliatedClubs: prev.affiliatedClubs.filter(id => id !== clubId) };
            } else {
                return { ...prev, affiliatedClubs: [...prev.affiliatedClubs, clubId] };
            }
        });
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                    <FaChevronLeft />
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Club Profile</h2>
            </div>

            {error && <div style={{ color: '#ef4444', background: '#fee2e2', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
            {success && <div style={{ color: '#10b981', background: '#ecfdf5', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem' }}>{success}</div>}

            <Card style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Club Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: '#fff' }}
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Location</label>
                        <input
                            type="text"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="4"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold' }}>Manage Affiliated Clubs</label>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '12px', padding: '0.5rem' }}>
                            {availableClubs.length === 0 ? (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                    No other active clubs found. Only activated clubs can be selected as affiliates.
                                </div>
                            ) : (
                                availableClubs.map(club => (
                                    <div
                                        key={club._id}
                                        onClick={() => toggleAffiliate(club._id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                                            background: formData.affiliatedClubs.includes(club._id) ? '#eff6ff' : 'transparent',
                                            cursor: 'pointer', borderRadius: '8px', marginBottom: '0.25rem',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.affiliatedClubs.includes(club._id)}
                                            readOnly
                                            style={{ width: '18px', height: '18px' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{club.name}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{club.location}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <Button type="submit" variant="primary" fullWidth disabled={submitting} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        {submitting ? 'Saving Changes...' : <><FaSave /> Save Changes</>}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default EditClub;
