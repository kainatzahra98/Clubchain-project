import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { FaArrowLeft, FaMapMarkerAlt, FaStar, FaInfoCircle, FaCalendarAlt, FaChevronRight, FaCheck } from 'react-icons/fa';
import api from '../../utils/api';
import PaymentModal from '../../components/UI/PaymentModal';

const ClubDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    // Assuming setToast and setMemberStatus would be provided by a context or parent component
    // For this change, we'll simulate them or acknowledge their absence.
    const setToast = ({ message, type }) => console.log(`Toast (${type}): ${message}`);
    const [memberStatus, setMemberStatus] = useState(null); // Added for simulation

    const [plans, setPlans] = useState([]);

    useEffect(() => {
        const fetchClubAndPlans = async () => {
            // In a real scenario, plans might be club-specific or global
            // We'll fetch global plans for now as per previous implementation pattern
            try {
                const [clubRes, plansRes] = await Promise.all([
                    api.get(`/clubs/${id}`),
                    api.get(`/membership-plans?clubId=${id}`)
                ]);
                setClub(clubRes.data);
                setPlans(plansRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setToast({ message: 'Failed to load club details', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchClubAndPlans();
    }, [id]);

    const handlePurchase = (plan) => {
        const user = localStorage.getItem('user');
        if (!user) {
            if (window.confirm('You need to be logged in to purchase a membership. Go to login?')) {
                navigate('/login');
            }
            return;
        }
        setSelectedPlan(plan);
        setIsPaymentOpen(true);
    };

    const handlePaymentComplete = async () => {
        setIsPaymentOpen(false);
        try {
            console.log('Joining with Plan ID:', selectedPlan._id);
            await api.post(`/clubs/${id}/join`, { planId: selectedPlan._id });
            alert(`Successfully joined as ${selectedPlan.title} Member!`);
            navigate('/client');
        } catch (err) {
            console.error('Join Error:', err);
            if (err.response) {
                if (err.response.status === 401) {
                    // Token invalid/expired
                    alert('Session expired. Please login again.');
                    localStorage.removeItem('user');
                    navigate('/login');
                    return;
                }
                const errorData = err.response.data;
                const msg = errorData.message || JSON.stringify(errorData);
                alert(`Server Error: ${msg}`);
            } else if (err.request) {
                alert('Network Error: Could not connect to server.');
            } else {
                alert(`Error: ${err.message}`);
            }
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>;
    if (!club) return <div style={{ padding: '2rem', textAlign: 'center' }}>Club not found</div>;

    return (
        <div style={{ paddingBottom: '2rem', minHeight: '100vh', background: '#ffffff', color: '#1a1a2e' }}>
            <div style={{
                height: '300px',
                background: club.image ? `url(${club.image}) center/cover no-repeat` : 'linear-gradient(to bottom right, #2c3e50, #bdc3c7)',
                position: 'relative'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        position: 'absolute', top: '20px', left: '20px',
                        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                        width: '40px', height: '40px', color: 'white', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    <FaArrowLeft />
                </button>
            </div>

            <div style={{ padding: '1.5rem', marginTop: '-40px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{club.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                            <FaMapMarkerAlt /> {club.location}
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255, 215, 0, 0.1)', color: '#ffd700', padding: '0.5rem 0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
                        <FaStar /> {club.rating || '4.9'}
                    </div>
                </div>

                <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '2rem' }}>
                    {club.description}
                </p>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Amenities</h3>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {club.amenities && club.amenities.map((amenity, index) => (
                        <Amenity key={index} icon={<FaInfoCircle />} label={amenity} />
                    ))}
                    {!club.amenities && (
                        <>
                            <Amenity icon={<FaCalendarAlt />} label="Exclusive Events" />
                            <Amenity icon={<FaChevronRight />} label="Elite Network" />
                        </>
                    )}
                </div>

                {club.affiliatedClubs && club.affiliatedClubs.length > 0 && (
                    <>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Affiliated Clubs</h3>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {club.affiliatedClubs.map((affiliate) => (
                                <div
                                    key={affiliate._id}
                                    onClick={() => navigate(`/client/clubs/${affiliate._id}`)}
                                    style={{
                                        minWidth: '200px',
                                        background: '#f8f9fa',
                                        borderRadius: '16px',
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        border: '1px solid #e9ecef'
                                    }}
                                >
                                    <h4 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0' }}>{affiliate.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                                        <FaMapMarkerAlt /> {affiliate.location}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Membership Plans</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {plans.map((plan, index) => (
                        <div key={plan._id || index} style={{
                            padding: '1.5rem', borderRadius: '20px',
                            background: plan.isPremium ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#f1f5f9',
                            color: plan.isPremium ? 'white' : '#1e293b',
                            boxShadow: plan.isPremium ? '0 10px 20px rgba(0,0,0,0.2)' : 'none'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{plan.title || plan.name}</h4>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: plan.isPremium ? '#38bdf8' : '#0284c7' }}>{plan.price}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>
                                Valid for {plan.durationMonths || 12} months
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {plan.features && plan.features.map((feature, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
                                        <FaCheck size={12} color={plan.isPremium ? '#38bdf8' : '#0284c7'} /> {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                variant={plan.isPremium ? 'primary' : 'secondary'}
                                fullWidth
                                onClick={() => handlePurchase(plan)}
                            >
                                Select {plan.title || plan.name}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                onPaymentComplete={handlePaymentComplete}
                planName={selectedPlan?.title || selectedPlan?.name}
                amount={selectedPlan?.price}
            />
        </div>
    );
};

const Amenity = ({ icon, label }) => (
    <div style={{
        background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '16px',
        minWidth: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        border: '1px solid rgba(0,0,0,0.1)'
    }}>
        <div style={{ fontSize: '1.5rem', color: '#00d2ff' }}>{icon}</div>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{label}</span>
    </div>
);

export default ClubDetails;
