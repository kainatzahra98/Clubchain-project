import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Toast from '../../components/UI/Toast';
import { FaCheck, FaTimes, FaUser, FaClock, FaFileAlt, FaQrcode, FaFilePdf } from 'react-icons/fa';
import api from '../../utils/api';
import MemberDetails from './MemberDetails';

const Tasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const handlePdfAction = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            const response = await api.get(`/intro-letters/${id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (err) {
            console.error('View failed', err);
            setToast({ message: 'Failed to open letter', type: 'error' });
        }
    };

    const fetchData = async () => {
        try {
            const response = await api.get('/tasks');
            setTasks(response.data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setToast({ message: 'Failed to fetch pending tasks.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTaskAction = async (id, action) => {
        try {
            await api.put(`/tasks/${id}`, { action });
            setToast({ message: `Task ${action === 'approve' ? 'approved' : 'rejected'} successfully!`, type: 'success' });
            fetchData();
        } catch (err) {
            console.error('Error updating task:', err);
            setToast({ message: 'Failed to update task.', type: 'error' });
        }
    };

    const getStatusBadge = (status) => {
        const s = status ? status.toUpperCase() : 'PENDING';
        let style = { bg: '#fffbeb', color: '#f59e0b', icon: <FaClock /> };
        if (s === 'APPROVED' || s === 'COMPLETED') style = { bg: '#ecfdf5', color: '#10b981', icon: <FaCheck /> };
        if (s === 'REJECTED') style = { bg: '#fef2f2', color: '#ef4444', icon: <FaTimes /> };
        if (s === 'ACCEPTED') style = { bg: '#eff6ff', color: '#3b82f6', icon: <FaCheck /> };

        return (
            <span style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                background: style.bg, color: style.color,
                padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold'
            }}>
                {style.icon} {s}
            </span>
        );
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;

    const visibleTasks = tasks.filter(t =>
        t.type === 'INTRO_LETTER_APPROVAL' || t.type === 'VISIT_CONFIRMATION'
    );

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Admin Tasks</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Pending requests that need your attention</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {visibleTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '20px' }}>
                        <FaCheck size={40} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: '#94a3b8' }}>All caught up! No pending tasks.</p>
                    </div>
                ) : (
                    visibleTasks.map(task => {
                        const isLetter = task.type === 'INTRO_LETTER_APPROVAL';
                        const isVisit = task.type === 'VISIT_CONFIRMATION';

                        // Polymorphic handling
                        const related = task.relatedId;
                        // For Visit Confirmation, related is IntroLetter, need memberId populated
                        // getTasks populates memberId for IntroLetter

                        const member = (isLetter || isVisit) ? related?.memberId : related?.userId;
                        const targetClub = related?.targetClubId;
                        const plan = related?.planId;

                        return (
                            <Card key={task._id} style={{ border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{
                                            width: '45px', height: '45px', borderRadius: '12px',
                                            background: isVisit ? '#ecfdf5' : (isLetter ? '#eef2ff' : '#f1f5f9'),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isVisit ? '#10b981' : (isLetter ? '#6366f1' : '#3a7bd5')
                                        }}>
                                            {isVisit ? <FaUser size={20} /> : (isLetter ? <FaFileAlt size={20} /> : <FaUser size={20} />)}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isVisit ? '#10b981' : (isLetter ? '#6366f1' : '#3a7bd5'), textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                                                {isVisit ? 'Incoming Visitor' : (isLetter ? 'Intro Letter' : 'Membership Request')}
                                            </div>
                                            <h4
                                                onClick={() => member && setSelectedMember(member)}
                                                style={{ fontSize: '1.1rem', marginBottom: '0.1rem', cursor: member ? 'pointer' : 'default', textDecoration: member ? 'underline' : 'none', color: member ? '#3b82f6' : 'inherit' }}
                                            >
                                                {member?.name || 'Unknown User'}
                                            </h4>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <FaClock /> {new Date(task.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    {getStatusBadge(task.status)}
                                </div>

                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                                    <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.4' }}>
                                        {isVisit ? (
                                            <>Approved visitor from <strong>{related?.homeClubId?.name || 'another club'}</strong> arriving on {new Date(related?.visitDate).toLocaleDateString()}.</>
                                        ) : isLetter ? (
                                            <>Wants to visit <strong>{targetClub?.name || 'another club'}</strong> on {new Date(related?.visitDate).toLocaleDateString()}.</>
                                        ) : (
                                            <>Requesting <strong>{plan?.title || 'Standard'}</strong> plan.</>
                                        )}
                                    </p>
                                    {(isLetter || isVisit) && related?.purpose && (
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                            "{related.purpose}"
                                        </p>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {isVisit ? (
                                        <>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => navigate('/club-admin/scan-qr')}
                                                        style={{
                                                            flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#3b82f6', color: 'white',
                                                            border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                            cursor: 'pointer', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        <FaQrcode /> Scan
                                                    </button>
                                                    <button
                                                        onClick={(e) => handlePdfAction(related?._id, e)}
                                                        style={{
                                                            flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#6366f1', color: 'white',
                                                            border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                            cursor: 'pointer', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        <FaFilePdf /> View
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await api.put(`/intro-letters/${related?._id}/accept`);
                                                                setToast({ message: 'Visitor accepted!', type: 'success' });
                                                                fetchData();
                                                            } catch (e) {
                                                                console.error(e);
                                                                setToast({ message: 'Failed to accept visitor.', type: 'error' });
                                                            }
                                                        }}
                                                        style={{
                                                            flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#10b981', color: 'white',
                                                            border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                            cursor: 'pointer', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        <FaCheck /> Confirm
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const reason = window.prompt("Reason for rejection (this will be sent to the member):");
                                                            if (!reason) return;

                                                            try {
                                                                await api.put(`/intro-letters/${related?._id}/reject`, { rejectionReason: reason });
                                                                setToast({ message: 'Visitor rejected.', type: 'success' });
                                                                fetchData();
                                                            } catch (e) {
                                                                console.error(e);
                                                                setToast({ message: 'Failed to reject visitor.', type: 'error' });
                                                            }
                                                        }}
                                                        style={{
                                                            flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#fee2e2', color: '#dc2626',
                                                            border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                            cursor: 'pointer', fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        <FaTimes /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => handleTaskAction(task._id, 'approve')}
                                                style={{
                                                    flex: 1, padding: '0.75rem', borderRadius: '12px', background: '#10b981', color: 'white',
                                                    border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                    cursor: 'pointer', transition: 'transform 0.1s'
                                                }}
                                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                <FaCheck /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleTaskAction(task._id, 'deny')}
                                                style={{
                                                    flex: 1, padding: '0.75rem', borderRadius: '12px', background: 'white', color: '#ef4444',
                                                    border: '1px solid #ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <FaTimes /> Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Member Details Modal */}
            {selectedMember && (
                <MemberDetails
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </div>
    );
};

export default Tasks;
