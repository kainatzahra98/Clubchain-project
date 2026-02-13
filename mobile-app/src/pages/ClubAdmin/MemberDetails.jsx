import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaHistory, FaStickyNote, FaEdit, FaCheck, FaSpinner } from 'react-icons/fa';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import api from '../../utils/api';

const MemberDetails = ({ member, onClose, canEdit = false }) => {
    const [memberData, setMemberData] = useState(member);
    const [notes, setNotes] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            // If member object seems incomplete (e.g. missing joinedAt which is on Membership), fetch full details
            // NOTE: Only if we are in a context where we CAN fetch (e.g. valid ID).
            // If it's a visitor (Tasks page Visit Confirmation), we might not have permission to fetch /members/:id if they aren't OUR member.
            // But if they ARE our member (Tasks page Intro Request), we can.
            // We'll try to fetch, and if 404/403, we just use what we have.
            if (member && (!member.joinedAt || !member.planId)) {
                try {
                    setLoading(true);
                    const id = member.id || member._id;
                    const res = await api.get(`/members/${id}`);
                    setMemberData({ ...member, ...res.data });
                    setNotes(res.data.notes || '');
                } catch (error) {
                    console.log('Could not fetch additional details (might be visitor):', error);
                    setNotes(member.notes || '');
                } finally {
                    setLoading(false);
                }
            } else {
                setNotes(member.notes || '');
                setMemberData(member);
            }
        };

        if (member) {
            setMemberData(member); // Reset immediately on change
            fetchDetails();
        }
    }, [member]);

    const handleSaveNotes = async () => {
        try {
            setSaving(true);
            const userId = member.id || member._id;
            await api.put(`/members/${userId}/notes`, { notes });
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update notes:', error);
            alert('Failed to update notes');
        } finally {
            setSaving(false);
        }
    };

    if (!member) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                background: '#ffffff', width: '100%', maxWidth: '500px', height: '85vh',
                borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                padding: '2rem', overflowY: 'auto',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                animation: 'slideUp 0.3s ease-out',
                color: '#1f2937'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button onClick={onClose} style={{
                        background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', cursor: 'pointer'
                    }}>
                        <FaTimes size={16} />
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '96px', height: '96px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                        color: '#4f46e5', margin: '0 auto 1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '4px solid #ffffff', boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        fontSize: '2.5rem', fontWeight: 'bold'
                    }}>
                        {memberData.name ? memberData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>{memberData.name}</h2>
                    <p style={{ color: '#6b7280', fontSize: '1rem' }}>{memberData.email}</p>
                    <div style={{ marginTop: '1rem' }}>
                        <span style={{
                            padding: '0.35rem 1rem', borderRadius: '999px',
                            background: memberData.status?.toUpperCase() === 'ACTIVE' ? '#ecfdf5' :
                                (memberData.status?.toUpperCase() === 'EXPIRED' ? '#fef2f2' : '#fffbeb'),
                            color: memberData.status?.toUpperCase() === 'ACTIVE' ? '#059669' :
                                (memberData.status?.toUpperCase() === 'EXPIRED' ? '#ef4444' : '#d97706'),
                            fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.5px'
                        }}>
                            {memberData.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <Section title="Contact Information" icon={<FaUser color="#6366f1" />}>
                        <InfoRow label="Email" value={memberData.email} />
                        <InfoRow label="Phone" value={memberData.phone || 'Not provided'} />
                        <InfoRow label="Location" value={memberData.location || 'Unknown'} />
                    </Section>

                    <Section title="Membership Details" icon={<FaHistory color="#10b981" />}>
                        {loading ? <div style={{ padding: '0.5rem 1rem', color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>Loading membership details...</div> : (
                            <>
                                <InfoRow label="Plan" value={memberData.planId?.title || memberData.tier || 'Standard'} />
                                <InfoRow label="Joined" value={memberData.createdAt || memberData.joinedAt ? new Date(memberData.createdAt || memberData.joinedAt).toLocaleDateString() : 'N/A'} />
                                <InfoRow label="Expires" value={memberData.expiresAt ? new Date(memberData.expiresAt).toLocaleDateString() : 'Never'} />
                            </>
                        )}
                    </Section>

                    <Section
                        title="Notes"
                        icon={<FaStickyNote color="#f59e0b" />}
                        action={canEdit && !isEditing && (
                            <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                <FaEdit /> Edit
                            </button>
                        )}
                    >
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter notes about this member..."
                                    style={{
                                        width: '100%', minHeight: '100px', padding: '0.75rem',
                                        borderRadius: '8px', border: '1px solid #d1d5db',
                                        fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button variant="secondary" onClick={() => { setIsEditing(false); setNotes(memberData.notes || ''); }} disabled={saving}>Cancel</Button>
                                    <Button variant="primary" onClick={handleSaveNotes} disabled={saving}>
                                        {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />} Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '12px', color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                {loading ? 'Loading notes...' : (notes || 'No notes available for this member.')}
                            </div>
                        )}
                    </Section>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const Section = ({ title, icon, children, action }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                {icon} {title}
            </h3>
            {action}
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            {children}
        </div>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
        <span style={{ color: '#9ca3af', fontSize: '0.9rem', fontWeight: '500' }}>{label}</span>
        <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.95rem' }}>{value}</span>
    </div>
);

export default MemberDetails;
