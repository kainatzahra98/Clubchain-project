import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';

const CreateClub = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Health',
        location: '',
        affiliatedClubs: []
    });
    const [availableClubs, setAvailableClubs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = ['Health', 'Tech', 'Arts', 'Sports', 'Social', 'Professional'];

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const response = await api.get('/clubs');
                // Filter only active clubs to show in affiliation list
                setAvailableClubs(response.data.filter(c => c.status === 'active'));
            } catch (err) {
                console.error("Failed to fetch clubs for affiliation", err);
            }
        };
        fetchClubs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/clubs', {
                ...formData,
                status: 'pending' // Clubs start as pending for admin approval
            });
            const newClub = response.data;

            // Update local user storage with clubId while preserving token
            const userString = localStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                user.clubId = newClub._id;
                localStorage.setItem('user', JSON.stringify(user));
            }

            navigate('/club-admin/club-status'); // Go to status tracking page
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to submit club profile');
        } finally {
            setLoading(false);
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

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Create Your Club</h2>
                <p style={{ color: '#888' }}>Setup your community profile for approval</p>
            </header>

            <Card style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem', color: '#0c4a6e', border: '1px solid #bae6fd' }}>
                        <strong>Note:</strong> Your club will be hidden from members until a System Admin activates your profile.
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Club Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                            placeholder="e.g. Downtown Runners"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', background: '#fff' }}
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Location</label>
                        <input
                            type="text"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
                            placeholder="e.g. New York, NY"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows="4"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', fontFamily: 'inherit' }}
                            placeholder="Tell members what this club is about..."
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Select Affiliated Clubs</label>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '0.5rem' }}>
                            {availableClubs.length === 0 ? (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                    No active clubs available for affiliation yet. Only activated clubs can be selected as affiliates.
                                </div>
                            ) : (
                                availableClubs.map(club => (
                                    <div
                                        key={club._id}
                                        onClick={() => toggleAffiliate(club._id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
                                            background: formData.affiliatedClubs.includes(club._id) ? '#eff6ff' : 'transparent',
                                            cursor: 'pointer', borderRadius: '4px'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.affiliatedClubs.includes(club._id)}
                                            readOnly
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        <span style={{ fontSize: '0.9rem' }}>{club.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}

                    <Button type="submit" variant="primary" fullWidth disabled={loading} style={{ marginTop: '1rem' }}>
                        {loading ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default CreateClub;
