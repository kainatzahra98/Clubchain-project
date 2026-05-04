import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaArrowLeft } from 'react-icons/fa';

const ClubStatus = () => {
    const navigate = useNavigate();
    const [clubInfo, setClubInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user || !user.token) {
            navigate('/login');
            return;
        }

        const fetchClubStatus = async () => {
            try {
                if (user.clubId) {
                    const clubRes = await api.get(`/clubs/${user.clubId._id || user.clubId}`);
                    setClubInfo(clubRes.data);
                }
            } catch (err) {
                console.error('Error fetching club status:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchClubStatus();
        // Refresh every 30 seconds to check for status updates
        const interval = setInterval(fetchClubStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return {
                    icon: <FaHourglassHalf />,
                    color: '#f59e0b',
                    bgColor: '#fffbeb',
                    title: 'Application Pending',
                    description: 'Your club application is under review by the System Admin.',
                    steps: [
                        { label: 'Application Submitted', completed: true, time: 'Just now' },
                        { label: 'Under Review', completed: false, time: 'Waiting...' },
                        { label: 'Admin Approval', completed: false, time: 'Pending' },
                        { label: 'Club Activated', completed: false, time: 'Pending' }
                    ]
                };
            case 'active':
                return {
                    icon: <FaCheckCircle />,
                    color: '#10b981',
                    bgColor: '#ecfdf5',
                    title: 'Application Approved!',
                    description: 'Your club has been activated. You can now manage your club.',
                    steps: [
                        { label: 'Application Submitted', completed: true, time: 'Completed' },
                        { label: 'Under Review', completed: true, time: 'Completed' },
                        { label: 'Admin Approval', completed: true, time: 'Approved' },
                        { label: 'Club Activated', completed: true, time: 'Active now' }
                    ]
                };
            case 'inactive':
            case 'rejected':
                return {
                    icon: <FaTimesCircle />,
                    color: '#ef4444',
                    bgColor: '#fef2f2',
                    title: 'Application Inactive',
                    description: 'Your club application is currently inactive. Contact support for assistance.',
                    steps: [
                        { label: 'Application Submitted', completed: true, time: 'Completed' },
                        { label: 'Status', completed: false, time: 'Inactive', isAlert: true }
                    ]
                };
            default:
                return {
                    icon: <FaClock />,
                    color: '#6b7280',
                    bgColor: '#f9fafb',
                    title: 'No Application Found',
                    description: 'You haven\'t submitted a club application yet.',
                    steps: []
                };
        }
    };

    const statusConfig = getStatusConfig(clubInfo?.status);

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading application status...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <Button variant="secondary" onClick={() => navigate('/club-admin')} style={{ marginRight: '1rem' }}>
                    <FaArrowLeft /> Back
                </Button>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Application Status</h2>
            </div>

            {/* Status Card */}
            <Card style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: statusConfig.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    fontSize: '2rem',
                    color: statusConfig.color
                }}>
                    {statusConfig.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: statusConfig.color }}>
                    {statusConfig.title}
                </h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    {statusConfig.description}
                </p>
                {clubInfo?.name && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                        <strong>Club Name:</strong> {clubInfo.name}
                    </div>
                )}
            </Card>

            {/* Progress Steps */}
            {statusConfig.steps.length > 0 && (
                <Card style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Application Progress</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {statusConfig.steps.map((step, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.75rem',
                                background: step.completed ? '#ecfdf5' : (step.isAlert ? '#fef2f2' : '#f8fafc'),
                                borderRadius: '8px',
                                borderLeft: `4px solid ${step.completed ? '#10b981' : (step.isAlert ? '#ef4444' : '#cbd5e1')}`
                            }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: step.completed ? '#10b981' : (step.isAlert ? '#ef4444' : '#cbd5e1'),
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    marginRight: '0.75rem'
                                }}>
                                    {step.completed ? '✓' : (step.isAlert ? '!' : index + 1)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{step.label}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{step.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Club Details */}
            {clubInfo && (
                <Card style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Club Details</h4>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ color: '#666' }}>Name:</span>
                            <span style={{ fontWeight: '500' }}>{clubInfo.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ color: '#666' }}>Category:</span>
                            <span style={{ fontWeight: '500' }}>{clubInfo.category}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ color: '#666' }}>Location:</span>
                            <span style={{ fontWeight: '500' }}>{clubInfo.location}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ color: '#666' }}>Status:</span>
                            <span style={{
                                fontWeight: '500',
                                color: clubInfo.status === 'active' ? '#10b981' : (clubInfo.status === 'pending' ? '#f59e0b' : '#ef4444'),
                                textTransform: 'capitalize'
                            }}>
                                {clubInfo.status}
                            </span>
                        </div>
                        {clubInfo.description && (
                            <div style={{ padding: '0.5rem 0' }}>
                                <span style={{ color: '#666', display: 'block', marginBottom: '0.25rem' }}>Description:</span>
                                <span style={{ fontSize: '0.9rem' }}>{clubInfo.description}</span>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Auto-refresh info */}
            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.75rem', marginTop: '1rem' }}>
                Status updates automatically every 30 seconds
            </p>
        </div>
    );
};

export default ClubStatus;
