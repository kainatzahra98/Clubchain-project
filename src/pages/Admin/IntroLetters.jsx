import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './IntroLetters.css';
import { FaFileAlt, FaSearch, FaFilter, FaEye } from 'react-icons/fa';

import api from '../../utils/api';

const IntroLetters = () => {
    const [letters, setLetters] = React.useState([]);
    const [incomingLetters, setIncomingLetters] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('outbound'); // outbound or inbound
    const [stats, setStats] = React.useState({ total: 0, pending: 0, approved: 0, accepted: 0 });
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSystemAdmin = user.role === 'SYSTEM_ADMIN';

    const fetchData = async () => {
        setLoading(true);
        try {
            if (isSystemAdmin) {
                const res = await api.get('/intro-letters/admin/all');
                setLetters(res.data);
                updateStats(res.data);
            } else {
                // Club Admin fetches both
                const [outRes, inRes] = await Promise.all([
                    api.get('/intro-letters/pending'),
                    api.get('/intro-letters/incoming')
                ]);
                setLetters(outRes.data);
                setIncomingLetters(inRes.data);
                updateStats([...outRes.data, ...inRes.data]);
            }
        } catch (err) {
            console.error('Error fetching letters:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStats = (data) => {
        setStats({
            total: data.length,
            pending: data.filter(l => l.status === 'PENDING').length,
            approved: data.filter(l => l.status === 'APPROVED').length,
            accepted: data.filter(l => l.status === 'ACCEPTED').length
        });
    }

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        let rejectionReason = null;
        if (status === 'REJECTED') {
            rejectionReason = window.prompt('Please provide a reason for rejection:');
            if (rejectionReason === null) return;
        }

        try {
            await api.put(`/intro-letters/${id}/status`, { status, rejectionReason });
            alert(`Letter ${status.toLowerCase()} successfully`);
            fetchData();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Failed to update status');
        }
    };

    const StatsCard = ({ title, value, icon, color }) => (
        <div className="stats-card-small" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="stats-info">
                <span className="stats-title">{title}</span>
                <span className="stats-value">{value}</span>
            </div>
            <div className="stats-icon-small" style={{ color: color, background: `${color}20` }}>
                {icon}
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName="System Admin" />

                <div className="dashboard-content">
                    <div className="content-container animate-slide-up">
                        <div className="letters-header">
                            <div>
                                <h1>Introduction Letters</h1>
                                <p>{isSystemAdmin ? 'Monitor all cross-club visitation requests across the system.' : 'Manage visitation requests for your club and members.'}</p>
                            </div>
                        </div>

                        {!isSystemAdmin && (
                            <div className="tabs-container glass" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', padding: '0.5rem' }}>
                                <button
                                    className={`tab-btn ${activeTab === 'outbound' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('outbound')}
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', background: activeTab === 'outbound' ? '#6366f1' : 'transparent', color: activeTab === 'outbound' ? 'white' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Outbound Requests (My Members)
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'inbound' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('inbound')}
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', background: activeTab === 'inbound' ? '#6366f1' : 'transparent', color: activeTab === 'inbound' ? 'white' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Inbound Visitors (To My Club)
                                </button>
                            </div>
                        )}

                        {/* Stats Summary */}
                        <div className="stats-summary-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                            <StatsCard title="Total Requests" value={stats.total} icon={<FaFileAlt />} color="#6366f1" />
                            <StatsCard title="Pending" value={stats.pending} icon={<FaSearch />} color="#f59e0b" />
                            <StatsCard title="Approved" value={stats.approved} icon={<FaFileAlt />} color="#10b981" />
                            <StatsCard title="Accepted" value={stats.accepted} icon={<FaCheckCircle />} color="#8b5cf6" />
                        </div>

                        {loading ? (
                            <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>Loading letters...</div>
                        ) : (
                            <>
                                <div className="management-controls glass">
                                    <div className="search-bar">
                                        <FaSearch />
                                        <input type="text" placeholder="Search members or clubs..." />
                                    </div>
                                    <div className="filter-actions">
                                        <button className="btn-filter"><FaFilter /> Filter</button>
                                        <select className="status-select">
                                            <option>All Statuses</option>
                                            <option>PENDING</option>
                                            <option>APPROVED</option>
                                            <option>ACCEPTED</option>
                                            <option>REJECTED</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="letters-table-container">
                                    <table className="letters-table">
                                        <thead>
                                            <tr>
                                                <th>Member</th>
                                                <th>{isSystemAdmin || activeTab === 'inbound' ? 'Home Club' : 'Target Club'}</th>
                                                {isSystemAdmin && <th>Target Club</th>}
                                                <th>Visit Date</th>
                                                <th>Duration</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(isSystemAdmin ? letters : (activeTab === 'outbound' ? letters : incomingLetters)).map((letter) => (
                                                <tr key={letter._id}>
                                                    <td>
                                                        <div className="member-info">
                                                            <div className="member-avatar">{letter.memberId?.name?.charAt(0)}</div>
                                                            <span style={{ fontWeight: 500 }}>{letter.memberId?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {isSystemAdmin ? letter.homeClubId?.name :
                                                            (activeTab === 'outbound' ? letter.targetClubId?.name : letter.homeClubId?.name)}
                                                    </td>
                                                    {isSystemAdmin && <td>{letter.targetClubId?.name}</td>}
                                                    <td>
                                                        {letter.visitDate ? new Date(letter.visitDate).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td>
                                                        {letter.duration ? `${letter.duration} Day(s)` : '1 Day'}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${letter.status ? letter.status.toLowerCase() : ''}`}>
                                                            {letter.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            {activeTab === 'outbound' && letter.status === 'PENDING' && !isSystemAdmin && (
                                                                <>
                                                                    <button
                                                                        className="action-btn approve"
                                                                        title="Approve"
                                                                        onClick={() => handleStatusUpdate(letter._id, 'APPROVED')}
                                                                        style={{ color: '#10b981', border: '1px solid #10b981', background: 'transparent', padding: '0.4rem', borderRadius: '8px' }}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="action-btn reject"
                                                                        title="Reject"
                                                                        onClick={() => handleStatusUpdate(letter._id, 'REJECTED')}
                                                                        style={{ color: '#ef4444', border: '1px solid #ef4444', background: 'transparent', padding: '0.4rem', borderRadius: '8px' }}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                className="action-btn"
                                                                title="View Details"
                                                                onClick={() => setSelectedLetter(letter)}
                                                                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.4rem', borderRadius: '8px' }}
                                                            >
                                                                <FaEye />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Details Modal */}
                {selectedLetter && (
                    <div className="modal-overlay" style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }} onClick={() => setSelectedLetter(null)}>
                        <div className="modal-content" style={{
                            background: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '500px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Request Details</h2>
                                <button onClick={() => setSelectedLetter(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Member</label>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{selectedLetter.memberId?.name}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visit Date</label>
                                        <p style={{ fontSize: '1rem', color: '#334155' }}>
                                            {selectedLetter.visitDate ? new Date(selectedLetter.visitDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</label>
                                        <p style={{ fontSize: '1rem', color: '#334155' }}>
                                            {selectedLetter.duration ? `${selectedLetter.duration} Days` : '1 Day'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Purpose of Visit</label>
                                    <div style={{
                                        background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginTop: '0.5rem',
                                        border: '1px solid #e2e8f0', color: '#475569', lineHeight: '1.5'
                                    }}>
                                        {selectedLetter.purpose || 'No purpose specified.'}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Club</label>
                                    <p style={{ fontSize: '1rem', color: '#334155', fontWeight: '600' }}>{selectedLetter.targetClubId?.name}</p>
                                </div>

                                {selectedLetter.rejectionReason && (
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rejection Reason</label>
                                        <p style={{ color: '#ef4444' }}>{selectedLetter.rejectionReason}</p>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setSelectedLetter(null)}
                                    style={{
                                        padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#475569',
                                        border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntroLetters;
