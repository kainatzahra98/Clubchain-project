import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './MembershipPlans.css';
import { FaCrown, FaCheck, FaGem, FaStar, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../../utils/api';

const MembershipPlans = () => {
    const [plans, setPlans] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [editingPlan, setEditingPlan] = React.useState(null);

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'FaCrown': return <FaCrown />;
            case 'FaGem': return <FaGem />;
            case 'FaStar': return <FaStar />;
            default: return <FaStar />;
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await api.get('/membership-plans');
            setPlans(response.data);
        } catch (err) {
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPlans();
    }, []);

    const handleEdit = (plan) => {
        setEditingPlan({ ...plan });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/membership-plans/${editingPlan._id}`, editingPlan);
            setPlans(plans.map(p => p._id === editingPlan._id ? response.data : p));
            setEditingPlan(null);
        } catch (err) {
            console.error('Error saving plan:', err);
            alert('Failed to save plan changes');
        }
    };

    const handleChange = (e, field) => {
        setEditingPlan({ ...editingPlan, [field]: e.target.value });
    };

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName="System Admin" />

                <div className="dashboard-content">
                    <div className="content-container animate-slide-up">
                        <div className="plans-header">
                            <div>
                                <h1>Membership Plans</h1>
                                <p>Manage your club's subscription tiers and benefits.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading membership plans...</p>
                            </div>
                        ) : plans.length === 0 ? (
                            <div className="empty-state">
                                <p>No membership plans found. Please seed the database.</p>
                            </div>
                        ) : (
                            <div className="plans-container">
                                {plans.map((plan) => (
                                    <div key={plan._id} className={`plan-card ${plan.isPremium ? 'premium' : ''}`}>
                                        <div className="plan-icon">
                                            {getIcon(plan.icon)}
                                        </div>
                                        <div className="plan-header">
                                            <h2>{plan.title}</h2>
                                            <div className="plan-price">${plan.price} <span>/year</span></div>
                                            <p className="plan-description">{plan.description}</p>
                                        </div>
                                        <ul className="plan-features">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx}><FaCheck className="check-icon" /> {feature}</li>
                                            ))}
                                        </ul>
                                        <button className="btn-edit-plan" onClick={() => handleEdit(plan)}><FaEdit /> Edit Plan</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingPlan && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1a1a2e' }}>Edit Plan</h2>
                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Icon</label>
                                <select
                                    value={editingPlan.icon}
                                    onChange={(e) => handleChange(e, 'icon')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                >
                                    <option value="FaStar">Star (Silver)</option>
                                    <option value="FaCrown">Crown (Gold)</option>
                                    <option value="FaGem">Gem (Platinum)</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Plan Title</label>
                                <input
                                    type="text"
                                    value={editingPlan.title}
                                    onChange={(e) => handleChange(e, 'title')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Price (e.g., $150/mo)</label>
                                <input
                                    type="text"
                                    value={editingPlan.price}
                                    onChange={(e) => handleChange(e, 'price')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Duration (Months)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editingPlan.durationMonths || 12}
                                    onChange={(e) => handleChange(e, 'durationMonths')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Description</label>
                                <textarea
                                    value={editingPlan.description}
                                    onChange={(e) => handleChange(e, 'description')}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Access Rights / Features</label>
                                {editingPlan.features.map((feature, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={feature}
                                            onChange={(e) => {
                                                const newFeatures = [...editingPlan.features];
                                                newFeatures[idx] = e.target.value;
                                                setEditingPlan({ ...editingPlan, features: newFeatures });
                                            }}
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newFeatures = editingPlan.features.filter((_, i) => i !== idx);
                                                setEditingPlan({ ...editingPlan, features: newFeatures });
                                            }}
                                            style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingPlan({ ...editingPlan, features: [...editingPlan.features, ''] });
                                    }}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <FaPlus /> Add Access Right
                                </button>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editingPlan.isPremium}
                                        onChange={(e) => setEditingPlan({ ...editingPlan, isPremium: e.target.checked })}
                                    />
                                    Premium Plan
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setEditingPlan(null)} style={{
                                    flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer'
                                }}>Cancel</button>
                                <button type="submit" style={{
                                    flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: '600', cursor: 'pointer'
                                }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipPlans;
