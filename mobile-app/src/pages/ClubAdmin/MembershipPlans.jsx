import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaGem, FaCheck, FaEdit, FaPlus } from 'react-icons/fa';
import Button from '../../components/UI/Button';

const MembershipPlans = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    React.useEffect(() => {
        const fetchPlans = async () => {
            try {
                // If admin, fetch plans for their club
                const clubId = user?.clubId;
                const url = clubId ? `/membership-plans?clubId=${clubId}` : '/membership-plans';
                const response = await api.get(url);
                setPlans(response.data);
            } catch (err) {
                console.error('Error fetching plans:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, [user?.clubId]);

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem', background: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#1e293b' }}>
                    <FaArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                        {user?.role === 'SYSTEM_ADMIN' ? 'System Membership Plans' : 'Club Membership Plans'}
                    </h1>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Manage the tiers for {user?.role === 'SYSTEM_ADMIN' ? 'All Clubs' : 'Your Club'}</p>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading plans...</div>
                ) : plans.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', background: '#fff', borderRadius: '16px' }}>
                        No plans found for this club.
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div key={plan._id} style={{
                            background: '#fff', borderRadius: '16px', padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            border: plan.isActive ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                            opacity: plan.isActive ? 1 : 0.8
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>{plan.title}</h3>
                                    <div style={{ color: '#0284c7', fontWeight: 'bold', marginTop: '0.25rem' }}>{plan.price}</div>
                                </div>
                                <span style={{
                                    padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold',
                                    background: plan.isActive ? '#dcfce7' : '#f1f5f9', color: plan.isActive ? '#166534' : '#64748b'
                                }}>
                                    {plan.isActive ? 'Active' : 'Draft'}
                                </span>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {plan.features && plan.features.map((feature, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                                        <FaCheck size={12} color="#0284c7" /> {feature}
                                    </li>
                                ))}
                            </ul>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="secondary" fullWidth style={{ fontSize: '0.9rem', height: '2.5rem' }} onClick={() => navigate(`/club-admin/membership-plans/${plan._id}/edit`)}>
                                    <FaEdit /> Edit Details
                                </Button>
                            </div>
                        </div>
                    ))
                )}

                <button style={{
                    background: 'none', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '1.5rem',
                    color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    cursor: 'pointer', marginTop: '1rem'
                }} onClick={() => alert('Add Plan feature coming soon')}>
                    <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaPlus />
                    </div>
                    <span style={{ fontWeight: '600' }}>Create New Plan</span>
                </button>
            </div>
        </div>
    );
};

export default MembershipPlans;
