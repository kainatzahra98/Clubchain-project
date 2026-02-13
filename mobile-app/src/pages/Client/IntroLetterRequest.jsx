import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { FaChevronLeft, FaPaperPlane, FaSpinner } from 'react-icons/fa';

const IntroLetterRequest = () => {
    const navigate = useNavigate();
    const [myMemberships, setMyMemberships] = useState([]);
    const [selectedHomeClub, setSelectedHomeClub] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [formData, setFormData] = useState({
        targetClubId: '',
        visitDate: '',
        duration: '1',
        purpose: ''
    });
    const [loading, setLoading] = useState(false);
    const [fetchingTargets, setFetchingTargets] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Get clubs I'm a member of
                console.log('[DEBUG] Fetching joined clubs...');
                const myClubsRes = await api.get('/members/my-clubs');
                const memberships = myClubsRes.data.filter(m => m.status === 'active');
                console.log('[DEBUG] Active Memberships:', memberships);

                setMyMemberships(memberships);

                if (memberships.length === 0) {
                    setError('You must be an active member of at least one club to request an intro letter.');
                    return;
                }

                // 2. Auto-select the first club if there's only one
                if (memberships.length === 1) {
                    const homeClub = memberships[0].clubId;
                    setSelectedHomeClub(homeClub);
                    await fetchAffiliatedClubs(homeClub);
                }
            } catch (err) {
                console.error('[DEBUG] Error fetching joined clubs:', err);
                setError('Failed to load your clubs. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const fetchAffiliatedClubs = async (homeClub) => {
        setFetchingTargets(true);
        try {
            const homeClubId = homeClub._id;

            // Extract IDs as strings for reliable comparison
            // Check if homeClub is populated with affiliatedClubs or just has IDs
            const rawAffiliates = homeClub.affiliatedClubs || [];
            const affiliatedIds = rawAffiliates.map(c => String(c._id || c));

            console.log('[DEBUG] Affiliated IDs for home club:', homeClub.name, affiliatedIds);

            if (affiliatedIds.length === 0) {
                setClubs([]);
                setFetchingTargets(false);
                return;
            }

            // Get all clubs and filter
            const clubsRes = await api.get('/clubs');
            const affiliatedClubs = clubsRes.data.filter(c =>
                c.status === 'active' &&
                String(c._id) !== String(homeClubId) &&
                affiliatedIds.includes(String(c._id))
            );
            console.log('[DEBUG] Found target clubs:', affiliatedClubs.length);

            setClubs(affiliatedClubs);
        } catch (err) {
            console.error('[DEBUG] Error filtering target clubs:', err);
            setError('Failed to load available target clubs.');
        } finally {
            setFetchingTargets(false);
        }
    };

    const handleHomeClubChange = async (e) => {
        const clubId = e.target.value;
        const membership = myMemberships.find(m => (m.clubId._id || m.clubId) === clubId);
        if (membership) {
            setSelectedHomeClub(membership.clubId);
            setLoading(true);
            setClubs([]);
            setFormData({ ...formData, targetClubId: '' });
            await fetchAffiliatedClubs(membership.clubId);
            setLoading(false);
        } else {
            setSelectedHomeClub(null);
            setClubs([]);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                ...formData,
                homeClubId: selectedHomeClub?._id,
                duration: parseInt(formData.duration)
            };
            await api.post('/intro-letters/request', payload);
            navigate('/client/my-letters');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                    <FaChevronLeft />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Request Introduction</h1>
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>{error}</div>}

            <Card>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {myMemberships.length > 1 && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Select Your Home Club</label>
                            <select
                                value={selectedHomeClub?._id || ''}
                                onChange={handleHomeClubChange}
                                required
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '1rem' }}
                            >
                                <option value="">-- Choose your Home Club --</option>
                                {myMemberships.map(m => (
                                    <option key={m.clubId._id} value={m.clubId._id}>{m.clubId.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {myMemberships.length === 1 && (
                        <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Home Club:</span>
                            <div style={{ fontWeight: 'bold', color: '#111827' }}>{selectedHomeClub?.name}</div>
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>
                            Select Club to Visit {fetchingTargets && <FaSpinner className="animate-spin" style={{ marginLeft: '0.5rem', display: 'inline' }} />}
                        </label>
                        <select
                            name="targetClubId"
                            value={formData.targetClubId}
                            onChange={handleChange}
                            required
                            disabled={!selectedHomeClub || fetchingTargets}
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb', background: (selectedHomeClub && !fetchingTargets) ? '#f9fafb' : '#f3f4f6', fontSize: '1rem' }}
                        >
                            <option value="">
                                {fetchingTargets ? 'Loading available clubs...' :
                                    !selectedHomeClub ? '-- Select Home Club First --' :
                                        clubs.length === 0 ? '-- No Affiliated Clubs Found --' :
                                            '-- Choose a Target Club --'}
                            </option>
                            {clubs.map(club => (
                                <option key={club._id} value={club._id}>{club.name}</option>
                            ))}
                        </select>
                        {selectedHomeClub && !fetchingTargets && clubs.length === 0 && (
                            <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.5rem' }}>
                                This club has no active affiliations. Please contact your administrator.
                            </p>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Date of Visit</label>
                        <input
                            type="date"
                            name="visitDate"
                            value={formData.visitDate}
                            onChange={handleChange}
                            required
                            min={new Date().toISOString().split('T')[0]}
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '12px',
                                border: '1px solid #e5e7eb', background: '#f9fafb',
                                fontSize: '1rem', fontFamily: 'inherit',
                                appearance: 'none', minHeight: '52px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Duration (Days)</label>
                        <input
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            required
                            min="1"
                            max="30"
                            placeholder="1"
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '12px',
                                border: '1px solid #e5e7eb', background: '#f9fafb',
                                fontSize: '1rem', fontFamily: 'inherit',
                                minHeight: '52px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4b5563' }}>Purpose of Visit</label>
                        <textarea
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Business meeting, Gym access, Social event..."
                            rows="3"
                            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '1rem', fontFamily: 'inherit' }}
                        />
                    </div>

                    <Button variant="primary" fullWidth type="submit" disabled={loading || submitting || !selectedHomeClub} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {submitting ? 'Submitting...' : <><FaPaperPlane /> Send Request</>}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default IntroLetterRequest;
