import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './MembershipPlans.css';
import { FaCrown, FaCheck, FaGem, FaStar, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../../utils/api';

const MembershipPlans = () => {
    const [plans, setPlans] = React.useState([]);
    const [memberships, setMemberships] = React.useState([]);
    const [clubs, setClubs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('plans');
    const [editingPlan, setEditingPlan] = React.useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [newPlan, setNewPlan] = React.useState({
        title: '',
        price: '',
        description: '',
        features: [''],
        durationMonths: 12,
        icon: 'FaStar',
        isPremium: false,
        clubId: ''
    });

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'FaCrown': return <FaCrown />;
            case 'FaGem': return <FaGem />;
            case 'FaStar': return <FaStar />;
            default: return <FaStar />;
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [plansRes, membershipsRes, clubsRes] = await Promise.all([
                api.get('/membership-plans'),
                api.get('/members/all-memberships'),
                api.get('/clubs')
            ]);
            setPlans(plansRes.data);
            setMemberships(membershipsRes.data);
            setClubs(clubsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
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

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newPlan.clubId) {
            alert('Please select a club for this plan');
            return;
        }
        try {
            const response = await api.post('/membership-plans', newPlan);
            setPlans([response.data, ...plans]);
            setIsCreateModalOpen(false);
            setNewPlan({
                title: '',
                price: '',
                description: '',
                features: [''],
                durationMonths: 12,
                icon: 'FaStar',
                isPremium: false,
                clubId: ''
            });
        } catch (err) {
            console.error('Error creating plan:', err);
            alert('Failed to create membership plan');
        }
    };

    const handleChange = (e, field) => {
        setEditingPlan({ ...editingPlan, [field]: e.target.value });
    };

    const handleNewPlanChange = (e, field) => {
        setNewPlan({ ...newPlan, [field]: e.target.value });
    };

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName="System Admin" />

                <div className="dashboard-content">
                    <div className="content-container animate-slide-up">
                        <div className="plans-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1>Membership Management</h1>
                                <p>Manage your club's subscription tiers and view active memberships.</p>
                            </div>
                            {activeTab === 'plans' && (
                                <button className="btn-add-new" onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    <FaPlus /> Create Plan
                                </button>
                            )}
                        </div>

                        <div className="tabs-container glass" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', padding: '0.5rem' }}>
                            <button 
                                className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
                                onClick={() => setActiveTab('plans')}
                                style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', background: activeTab === 'plans' ? '#6366f1' : 'transparent', color: activeTab === 'plans' ? 'white' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Membership Plans
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'memberships' ? 'active' : ''}`}
                                onClick={() => setActiveTab('memberships')}
                                style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', background: activeTab === 'memberships' ? '#6366f1' : 'transparent', color: activeTab === 'memberships' ? 'white' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Active Memberships
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
                                <p>Loading data...</p>
                            </div>
                        ) : activeTab === 'plans' ? (
                            plans.length === 0 ? (
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
                                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6366f1', fontWeight: 'bold', letterSpacing: '1px' }}>
                                                    {plan.clubId?.name || 'Global Plan'}
                                                </span>
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
                            )
                        ) : (
                            <div className="memberships-table-container glass">
                                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
                                    <button 
                                        onClick={fetchData}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                    >
                                        ↻ Refresh Data
                                    </button>
                                </div>
                                <table className="management-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>User</th>
                                            <th style={{ padding: '1rem' }}>Club</th>
                                            <th style={{ padding: '1rem' }}>Plan</th>
                                            <th style={{ padding: '1rem' }}>Status</th>
                                            <th style={{ padding: '1rem' }}>Expires At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {memberships.map((m) => (
                                            <tr key={m._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                            {m.userId?.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{m.userId?.name || 'Unknown'}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.userId?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{m.clubId?.name || 'N/A'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ fontWeight: '500', color: '#4f46e5' }}>{m.planId?.title || 'Standard'}</span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`status-badge ${m.status}`} style={{
                                                        padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                                                        background: m.status === 'active' ? '#dcfce7' : '#fee2e2',
                                                        color: m.status === 'active' ? '#166534' : '#991b1b'
                                                    }}>
                                                        {m.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{m.expiresAt ? new Date(m.expiresAt).toLocaleDateString() : 'Never'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {memberships.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                        No active memberships found.
                                    </div>
                                )}
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
            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1a1a2e' }}>Create New Plan</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Select Club</label>
                                <select
                                    required
                                    value={newPlan.clubId}
                                    onChange={(e) => handleNewPlanChange(e, 'clubId')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                >
                                    <option value="">Select a Club...</option>
                                    {clubs.map(club => (
                                        <option key={club._id} value={club._id}>{club.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Icon</label>
                                <select
                                    value={newPlan.icon}
                                    onChange={(e) => handleNewPlanChange(e, 'icon')}
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
                                    required
                                    placeholder="e.g. Premium Plus"
                                    value={newPlan.title}
                                    onChange={(e) => handleNewPlanChange(e, 'title')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Price (Display Text)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. $150"
                                    value={newPlan.price}
                                    onChange={(e) => handleNewPlanChange(e, 'price')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Duration (Months)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={newPlan.durationMonths}
                                    onChange={(e) => handleNewPlanChange(e, 'durationMonths')}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Description</label>
                                <textarea
                                    required
                                    placeholder="Short summary of the plan..."
                                    value={newPlan.description}
                                    onChange={(e) => handleNewPlanChange(e, 'description')}
                                    rows="2"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b' }}>Features / Access Rights</label>
                                {newPlan.features.map((feature, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Priority Booking"
                                            value={feature}
                                            onChange={(e) => {
                                                const newFeatures = [...newPlan.features];
                                                newFeatures[idx] = e.target.value;
                                                setNewPlan({ ...newPlan, features: newFeatures });
                                            }}
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newFeatures = newPlan.features.filter((_, i) => i !== idx);
                                                setNewPlan({ ...newPlan, features: newFeatures });
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
                                        setNewPlan({ ...newPlan, features: [...newPlan.features, ''] });
                                    }}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <FaPlus /> Add Feature
                                </button>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={newPlan.isPremium}
                                        onChange={(e) => setNewPlan({ ...newPlan, isPremium: e.target.checked })}
                                    />
                                    Mark as Premium
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{
                                    flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer'
                                }}>Cancel</button>
                                <button type="submit" style={{
                                    flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: '600', cursor: 'pointer'
                                }}>Create Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipPlans;
