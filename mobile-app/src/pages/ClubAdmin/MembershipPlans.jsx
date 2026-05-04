import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaGem, FaCheck, FaEdit, FaPlus, FaTrash, FaTimes, FaStar, FaCrown } from 'react-icons/fa';
import Button from '../../components/UI/Button';
import api from '../../utils/api';

const MembershipPlans = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);
    const [editingPlan, setEditingPlan] = React.useState(null);
    const [formData, setFormData] = React.useState({
        title: '',
        price: '',
        description: '',
        features: [''],
        icon: 'FaStar',
        isPremium: false,
        durationMonths: 12,
        isActive: true
    });

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const clubId = user?.clubId;
            const isClubAdmin = user?.role === 'CLUB_ADMIN';
            const url = clubId
                ? `/membership-plans?clubId=${clubId}${isClubAdmin ? '&strict=true' : ''}`
                : '/membership-plans';
            const response = await api.get(url);
            setPlans(response.data);
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPlans();
    }, [user?.clubId, user?.role]);

    const handleOpenCreate = () => {
        setIsCreating(true);
        setEditingPlan(null);
        setFormData({
            title: '',
            price: '',
            description: '',
            features: [''],
            icon: 'FaStar',
            isPremium: false,
            durationMonths: 12,
            isActive: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (plan) => {
        setIsCreating(false);
        setEditingPlan(plan);
        setFormData({
            title: plan.title,
            price: plan.price,
            description: plan.description,
            features: plan.features.length > 0 ? [...plan.features] : [''],
            icon: plan.icon || 'FaStar',
            isPremium: plan.isPremium || false,
            durationMonths: plan.durationMonths || 12,
            isActive: plan.isActive !== undefined ? plan.isActive : true
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFeatureChange = (index, value) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = value;
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => {
        setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
    };

    const removeFeature = (index) => {
        const newFeatures = formData.features.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, features: newFeatures.length > 0 ? newFeatures : [''] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                features: formData.features.filter(f => f.trim() !== ''),
                clubId: user?.clubId
            };

            if (isCreating) {
                await api.post('/membership-plans', data);
            } else {
                await api.put(`/membership-plans/${editingPlan._id}`, data);
            }
            
            handleCloseModal();
            fetchPlans();
        } catch (err) {
            console.error('Error saving plan:', err);
            alert('Failed to save plan: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            try {
                await api.delete(`/membership-plans/${id}`);
                fetchPlans();
            } catch (err) {
                console.error('Error deleting plan:', err);
                alert('Failed to delete plan: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'FaCrown': return <FaCrown />;
            case 'FaGem': return <FaGem />;
            case 'FaStar': return <FaStar />;
            default: return <FaStar />;
        }
    };

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
                {loading && plans.length === 0 ? (
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
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ color: '#0284c7', fontSize: '1.2rem' }}>
                                        {getIcon(plan.icon)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{plan.title}</h3>
                                        <div style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '0.9rem' }}>{plan.price}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.6rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 'bold',
                                        background: plan.isActive ? '#dcfce7' : '#f1f5f9', color: plan.isActive ? '#166534' : '#64748b'
                                    }}>
                                        {plan.isActive ? 'Active' : 'Draft'}
                                    </span>
                                    {plan.isPremium && (
                                        <span style={{ fontSize: '0.7rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            <FaCrown size={10} /> Premium
                                        </span>
                                    )}
                                </div>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {plan.features && plan.features.map((feature, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                                        <FaCheck size={10} color="#0284c7" /> {feature}
                                    </li>
                                ))}
                            </ul>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="secondary" fullWidth style={{ fontSize: '0.85rem', height: '2.5rem' }} onClick={() => handleOpenEdit(plan)}>
                                    <FaEdit /> Edit
                                </Button>
                                <Button variant="danger" style={{ width: '40px', height: '2.5rem', minWidth: 'auto', padding: 0, background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(plan._id)}>
                                    <FaTrash size={14} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}

                <button style={{
                    background: 'none', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '1.5rem',
                    color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    cursor: 'pointer', marginTop: '1rem', width: '100%'
                }} onClick={handleOpenCreate}>
                    <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaPlus />
                    </div>
                    <span style={{ fontWeight: '600' }}>Create New Plan</span>
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                }} onClick={handleCloseModal}>
                    <div style={{
                        backgroundColor: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                        width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
                        padding: '2rem', position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{isCreating ? 'Create Plan' : 'Edit Plan'}</h2>
                            <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b' }}>
                                <FaTimes />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>Plan Title</label>
                                <input
                                    type="text" name="title" required
                                    value={formData.title} onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                    placeholder="e.g. Gold Membership"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>Price (Display)</label>
                                    <input
                                        type="text" name="price" required
                                        value={formData.price} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                        placeholder="e.g. $150/yr"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>Duration (Months)</label>
                                    <input
                                        type="number" name="durationMonths" required
                                        value={formData.durationMonths} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>Description</label>
                                <textarea
                                    name="description" required
                                    value={formData.description} onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', minHeight: '80px' }}
                                    placeholder="Briefly describe the plan benefits"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>Features</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {formData.features.map((feature, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => handleFeatureChange(idx, e.target.value)}
                                                style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
                                                placeholder="e.g. Access to gym"
                                            />
                                            <button type="button" onClick={() => removeFeature(idx)} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addFeature} style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#64748b', borderRadius: '10px', padding: '0.6rem', fontSize: '0.85rem', fontWeight: '600' }}>
                                        + Add Feature
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.4rem', color: '#475569' }}>Icon</label>
                                    <select
                                        name="icon"
                                        value={formData.icon} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff' }}
                                    >
                                        <option value="FaStar">Star</option>
                                        <option value="FaCrown">Crown</option>
                                        <option value="FaGem">Gem</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox" name="isPremium"
                                            checked={formData.isPremium} onChange={handleInputChange}
                                        />
                                        Premium Plan
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#475569', cursor: 'pointer', marginTop: '0.5rem' }}>
                                        <input
                                            type="checkbox" name="isActive"
                                            checked={formData.isActive} onChange={handleInputChange}
                                        />
                                        Active
                                    </label>
                                </div>
                            </div>

                            <Button type="submit" variant="primary" fullWidth style={{ marginTop: '1rem', height: '3.5rem' }}>
                                {isCreating ? 'Create Plan' : 'Update Plan'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipPlans;
