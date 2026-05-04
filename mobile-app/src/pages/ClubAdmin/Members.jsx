import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import { FaSearch, FaEllipsisV, FaUserFriends, FaChevronLeft } from 'react-icons/fa';
import MemberDetails from './MemberDetails';
import api from '../../utils/api';

const Members = () => {
    const navigate = useNavigate();
    const [selectedMember, setSelectedMember] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Redirect if not logged in
    useEffect(() => {
        if (!user || !user.token) {
            navigate('/login');
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/members');
            setMembers(res.data);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return '#10b981';
            case 'PENDING': return '#f59e0b';
            case 'INACTIVE': return '#6b7280';
            default: return '#ef4444';
        }
    };

    const filteredMembers = members.filter(m =>
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                        <FaChevronLeft />
                    </button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Club Members</h2>
                </div>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                    {members.length} {members.length === 1 ? 'Member' : 'Members'}
                </div>
            </header>

            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '1rem 1rem 1rem 3rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'white',
                        outline: 'none'
                    }}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>Loading members...</div>
            ) : filteredMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
                    <FaUserFriends size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>{searchQuery ? 'No members match your search' : 'No members found in this club'}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredMembers.map((member) => (
                        <Card
                            key={member.id}
                            onClick={() => setSelectedMember(member)}
                            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#333', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.05)' }}>
                                    {member.image ? (
                                        <img src={member.image} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#312e81', color: '#818cf8', fontWeight: 'bold' }}>
                                            {member.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '0.1rem', fontWeight: '600' }}>{member.name}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: '500' }}>{member.tier} Plan</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '10px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    background: `${getStatusColor(member.status)}20`,
                                    color: getStatusColor(member.status),
                                    textTransform: 'uppercase'
                                }}>
                                    {member.status}
                                </div>
                                <FaEllipsisV color="#444" />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {selectedMember && <MemberDetails member={selectedMember} canEdit={true} onClose={() => setSelectedMember(null)} />}
        </div>
    );
};

export default Members;
