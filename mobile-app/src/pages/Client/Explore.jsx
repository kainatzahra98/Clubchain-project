import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaThumbsUp, FaThumbsDown, FaMedal, FaTrophy, FaSearch, FaChevronLeft } from 'react-icons/fa';
import api from '../../utils/api';

const MEDAL = ['🥇', '🥈', '🥉'];

const Explore = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [tab, setTab] = useState('rankings');
    const [rankings, setRankings] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Redirect if not logged in
    useEffect(() => {
        if (!user || !user.token) {
            navigate('/login');
        }
    }, []);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                console.log("🚀 Starting fetchAll in Explore page...");
                
                let clubsData = [];
                let rankingsData = [];
                
                try {
                    console.log("📡 Fetching clubs...");
                    const clubRes = await api.get('/clubs');
                    clubsData = clubRes.data || [];
                } catch (err) {
                    console.error("❌ Failed to fetch clubs:", err);
                }
                
                try {
                    console.log("📡 Fetching rankings...");
                    const rankingsRes = await api.get('/feedback/rankings');
                    rankingsData = rankingsRes.data || [];
                } catch (err) {
                    console.error("❌ Failed to fetch rankings:", err);
                    
                    // Fallback to manual ranking calculation if endpoint fails (e.g., using old production backend)
                    if (clubsData.length > 0) {
                        console.log("🔄 Using manual rankings fallback...");
                        rankingsData = clubsData
                            .map(club => {
                                const fb = club.realFeedback || { positiveCount: 0, negativeCount: 0, totalCount: 0, positivityScore: 0, positivityPct: 0, avgRating: 0 };
                                return {
                                    clubId: club._id,
                                    clubName: club.name,
                                    clubLocation: club.location,
                                    totalFeedback: fb.totalCount || 0,
                                    positiveCount: fb.positiveCount || 0,
                                    negativeCount: fb.negativeCount || 0,
                                    positivityScore: fb.positivityScore || 0,
                                    positivityPct: fb.positivityPct || 0,
                                    avgRating: fb.avgRating || club.stats?.rating || 0
                                };
                            })
                            .sort((a, b) => (b.positivityPct !== a.positivityPct ? b.positivityPct - a.positivityPct : b.avgRating - a.avgRating));
                    }
                }
                
                setClubs(clubsData);
                setRankings(rankingsData);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [location.key]);

    const filteredClubs = clubs.filter(c => {
        const searchTerm = search.toLowerCase().trim();
        if (!searchTerm) return true; // Show all clubs if search is empty
        return (
            (c.name && c.name.toLowerCase().includes(searchTerm)) ||
            (c.location && c.location.toLowerCase().includes(searchTerm))
        );
    });
    
    // Debug filtering
    console.log("🔍 Debug filtering:", {
        originalClubsLength: clubs.length,
        searchValue: search,
        filteredClubsLength: filteredClubs.length,
        firstClub: clubs[0],
        firstFilteredClub: filteredClubs[0]
    });
    
    
    
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '5rem' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                padding: '1.75rem 1.5rem 3rem',
                color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'white' }}>
                        <FaChevronLeft />
                    </button>
                    <FaTrophy color="#fbbf24" size={20} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Explore Clubs</h2>
                </div>
                <p style={{ color: '#94a3b8', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>Ranked by community feedback</p>

                {/* Search bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'white', borderRadius: '14px', padding: '0.65rem 1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                    <FaSearch color="#94a3b8" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search clubs..."
                        style={{ border: 'none', outline: 'none', flex: 1, fontSize: '0.95rem', color: '#1e293b', background: 'transparent' }}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', margin: '-1.5rem 1.25rem 1.25rem',
                background: 'white', borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {[['rankings', '🏆 Rankings'], ['all', '🌍 All Clubs']].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{
                        flex: 1, padding: '0.85rem', border: 'none', cursor: 'pointer',
                        fontWeight: tab === key ? '700' : '500',
                        fontSize: '0.9rem',
                        background: tab === key ? '#1e293b' : 'white',
                        color: tab === key ? 'white' : '#64748b',
                        transition: 'all 0.2s'
                    }}>
                        {label}
                    </button>
                ))}
            </div>

            <div style={{ padding: '0 1.25rem' }}>
                {/* Debug render state */}
                {console.log("🎨 Render state:", {
                    loading,
                    tab,
                    clubsLength: clubs.length,
                    rankingsLength: rankings.length,
                    filteredClubsLength: filteredClubs.length,
                    searchValue: search
                })}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div>
                ) : tab === 'rankings' ? (
                    <RankingsTab rankings={rankings} navigate={navigate} />
                ) : (
                    <AllClubsTab clubs={filteredClubs} navigate={navigate} />
                )}
            </div>
        </div>
    );
};

/* ── Rankings Tab ── */
const RankingsTab = ({ rankings, navigate }) => {
    if (rankings.length === 0) {
        return (
            <div style={{
                textAlign: 'center', padding: '4rem 2rem',
                background: 'white', borderRadius: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                <p style={{ color: '#64748b', fontWeight: '600' }}>No rankings yet.</p>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Be the first to leave feedback on a club!</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rankings.map((item, idx) => {
                const isTop3 = idx < 3;
                const medal = MEDAL[idx] || null;
                const positivityPct = item.totalFeedback > 0
                    ? Math.round((item.positiveCount / item.totalFeedback) * 100) : 0;

                return (
                    <div
                        key={item.clubId}
                        onClick={() => navigate(`/client/clubs/${item.clubId}`)}
                        style={{
                            background: isTop3
                                ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                                : 'white',
                            color: isTop3 ? 'white' : '#1e293b',
                            borderRadius: '24px',
                            padding: '1.5rem',
                            cursor: 'pointer',
                            boxShadow: isTop3
                                ? '0 8px 24px rgba(15,23,42,0.3)'
                                : '0 4px 12px rgba(0,0,0,0.06)',
                            border: isTop3 ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1f5f9',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'transform 0.15s',
                        }}
                    >
                        {/* Rank badge */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '2rem', lineHeight: 1 }}>
                                    {medal || (
                                        <span style={{
                                            fontSize: '1rem', fontWeight: '700',
                                            color: isTop3 ? '#94a3b8' : '#94a3b8',
                                            background: isTop3 ? 'rgba(255,255,255,0.1)' : '#f1f5f9',
                                            padding: '0.3rem 0.65rem',
                                            borderRadius: '10px'
                                        }}>#{idx + 1}</span>
                                    )}
                                </span>
                                <div>
                                    <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem' }}>{item.clubName}</p>
                                    <p style={{
                                        margin: 0, fontSize: '0.8rem',
                                        color: isTop3 ? '#94a3b8' : '#64748b',
                                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                                    }}>
                                        <FaMapMarkerAlt size={10} /> {item.clubLocation || 'Global'}
                                    </p>
                                </div>
                            </div>

                            {/* Avg rating */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                background: isTop3 ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.1)',
                                padding: '0.35rem 0.65rem', borderRadius: '10px'
                            }}>
                                <FaStar color="#fbbf24" size={13} />
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fbbf24' }}>
                                    {item.avgRating ?? '—'}
                                </span>
                            </div>
                        </div>

                        {/* Positivity bar */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{
                                height: '6px',
                                background: isTop3 ? 'rgba(255,255,255,0.15)' : '#f1f5f9',
                                borderRadius: '99px', overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%', width: `${positivityPct}%`,
                                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                                    borderRadius: '99px',
                                    transition: 'width 0.6s ease'
                                }} />
                            </div>
                            <p style={{
                                fontSize: '0.75rem', margin: '0.35rem 0 0',
                                color: isTop3 ? '#94a3b8' : '#94a3b8'
                            }}>
                                {positivityPct}% positive feedback
                            </p>
                        </div>

                        {/* Stats row */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <StatPill icon={<FaThumbsUp color="#10b981" />} value={item.positiveCount} label="Positive" dark={isTop3} />
                            <StatPill icon={<FaThumbsDown color="#ef4444" />} value={item.negativeCount} label="Negative" dark={isTop3} />
                            <StatPill icon={<FaMedal color="#f59e0b" />} value={item.positivityScore} label="Score" dark={isTop3} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const StatPill = ({ icon, value, label, dark }) => (
    <div style={{
        flex: 1, textAlign: 'center',
        background: dark ? 'rgba(255,255,255,0.07)' : '#f8fafc',
        borderRadius: '12px', padding: '0.6rem 0.4rem'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginBottom: '0.15rem' }}>
            {icon}
            <span style={{ fontWeight: '700', fontSize: '1rem', color: dark ? 'white' : '#1e293b' }}>{value}</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: dark ? '#64748b' : '#94a3b8' }}>{label}</span>
    </div>
);

/* ── All Clubs Tab ── */

const AllClubsTab = ({ clubs, navigate }) => {
    // Debug AllClubsTab
    console.log("🏢 AllClubsTab received clubs:", clubs.length);
    console.log("🏢 AllClubsTab clubs data:", clubs);
    console.log("🏢 AllClubsTab first club:", clubs[0]);
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {clubs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No clubs available in Explore.</div>
            )}
            {clubs.map(club => (
                <div
                    key={club._id}
                    onClick={() => navigate(`/client/clubs/${club._id}`)}
                    style={{
                        background: 'white', borderRadius: '20px', overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        border: '1px solid #f1f5f9', cursor: 'pointer'
                    }}
                >
                    {/* Only show image if club has one */}
                    {club.image && (
                        <div style={{
                            height: '110px',
                            background: `url(${club.image}) center/cover`,
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute', top: '10px', right: '10px',
                                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                                padding: '0.25rem 0.6rem', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'white'
                            }}>
                                <FaStar color="#ffd700" size={11} /> {club.stats?.rating || '—'}
                            </div>
                        </div>
                    )}
                    <div style={{ padding: club.image ? '1rem 1.25rem' : '1.5rem 1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, color: '#1e293b' }}>{club.name}</h3>
                            {/* Show rating badge only for clubs without image (to avoid duplication) */}
                            {!club.image && (
                                <div style={{
                                    background: 'rgba(251,191,36,0.1)',
                                    padding: '0.25rem 0.6rem', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem'
                                }}>
                                    <FaStar color="#fbbf24" size={11} /> {club.stats?.rating || '—'}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                            <FaMapMarkerAlt size={11} /> {club.location || 'Global'}
                        </div>
                        {club.description && (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0 0', lineHeight: '1.4' }}>
                                {club.description}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Explore;
