import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaGem, FaCheck, FaEdit, FaPlus, FaTrash, FaTimes, FaStar, FaCrown, FaPlay, FaPause, FaUsers, FaClipboardList } from 'react-icons/fa';
import Button from '../../components/UI/Button';
import api from '../../utils/api';

const MembershipPlans = () => {
    const navigate = useNavigate();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    // Tab state: 'plans' | 'members'
    const [activeTab, setActiveTab] = React.useState('plans');

    // Plans state
    const [plans, setPlans] = React.useState([]);
    const [plansLoading, setPlansLoading] = React.useState(true);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);
    const [editingPlan, setEditingPlan] = React.useState(null);
    const [formData, setFormData] = React.useState({
        title: '', price: '', description: '',
        features: [''], icon: 'FaStar', isPremium: false,
        durationMonths: 12, isActive: true
    });

    // Members state
    const [memberships, setMemberships] = React.useState([]);
    const [membersLoading, setMembersLoading] = React.useState(false);
    const [memberFilter, setMemberFilter] = React.useState('all');
    const [actionLoading, setActionLoading] = React.useState(null);
    const [toast, setToast] = React.useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ─── Plans Fetching ────────────────────────────────────────────────────────
    const fetchPlans = async () => {
        setPlansLoading(true);
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
            showToast('Failed to load plans', 'error');
        } finally {
            setPlansLoading(false);
        }
    };

    // ─── Memberships Fetching ──────────────────────────────────────────────────
    const fetchMemberships = async () => {
        setMembersLoading(true);
        try {
            const response = await api.get('/members/all-memberships');
            setMemberships(response.data);
        } catch (err) {
            console.error('Error fetching memberships:', err);
            showToast('Failed to load members', 'error');
        } finally {
            setMembersLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPlans();
    }, [user?.clubId, user?.role]);

    React.useEffect(() => {
        if (activeTab === 'members') {
            fetchMemberships();
        }
    }, [activeTab]);

    // ─── Plan CRUD ─────────────────────────────────────────────────────────────
    const handleOpenCreate = () => {
        setIsCreating(true);
        setEditingPlan(null);
        setFormData({ title: '', price: '', description: '', features: [''], icon: 'FaStar', isPremium: false, durationMonths: 12, isActive: true });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (plan) => {
        setIsCreating(false);
        setEditingPlan(plan);
        setFormData({
            title: plan.title, price: plan.price, description: plan.description,
            features: plan.features.length > 0 ? [...plan.features] : [''],
            icon: plan.icon || 'FaStar', isPremium: plan.isPremium || false,
            durationMonths: plan.durationMonths || 12, isActive: plan.isActive !== undefined ? plan.isActive : true
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData, features: formData.features.filter(f => f.trim() !== ''), clubId: user?.clubId };
            if (isCreating) {
                await api.post('/membership-plans', data);
                showToast('Plan created successfully');
            } else {
                await api.put(`/membership-plans/${editingPlan._id}`, data);
                showToast('Plan updated successfully');
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (err) {
            showToast('Failed to save plan: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            try {
                await api.delete(`/membership-plans/${id}`);
                showToast('Plan deleted');
                fetchPlans();
            } catch (err) {
                showToast('Failed to delete plan', 'error');
            }
        }
    };

    // ─── Membership Activation ─────────────────────────────────────────────────
    const handleActivate = async (membershipId) => {
        setActionLoading(membershipId);
        try {
            await api.put(`/members/${membershipId}/activate`);
            setMemberships(prev => prev.map(m => m._id === membershipId ? { ...m, status: 'active' } : m));
            showToast('Membership activated ✓');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to activate', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeactivate = async (membershipId) => {
        if (!window.confirm('Deactivate this membership?')) return;
        setActionLoading(membershipId);
        try {
            await api.put(`/members/${membershipId}/deactivate-by-admin`);
            setMemberships(prev => prev.map(m => m._id === membershipId ? { ...m, status: 'inactive' } : m));
            showToast('Membership deactivated');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to deactivate', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // ─── Helpers ───────────────────────────────────────────────────────────────
    const getIcon = (iconName) => {
        switch (iconName) {
            case 'FaCrown': return <FaCrown />;
            case 'FaGem': return <FaGem />;
            default: return <FaStar />;
        }
    };

    const statusStyle = (status) => {
        const map = {
            active: { background: '#dcfce7', color: '#166534' },
            pending: { background: '#fef3c7', color: '#92400e' },
            inactive: { background: '#f1f5f9', color: '#64748b' },
            expired: { background: '#fee2e2', color: '#991b1b' },
        };
        return map[status] || { background: '#e0e7ff', color: '#3730a3' };
    };

    const filteredMemberships = React.useMemo(() => {
        if (memberFilter === 'all') return memberships;
        return memberships.filter(m => m.status === memberFilter);
    }, [memberships, memberFilter]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem', background: '#f8fafc', minHeight: '100vh' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, padding: '0.75rem 1.5rem', borderRadius: '50px',
                    background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: toast.type === 'error' ? '#991b1b' : '#166534',
                    fontWeight: '600', fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap'
                }}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#1e293b', cursor: 'pointer' }}>
                    <FaArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b' }}>Membership Management</h1>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Plans & Members for your club</p>
                </div>
            </header>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '14px', padding: '0.3rem', marginBottom: '1.5rem', gap: '0.25rem' }}>
                {[
                    { key: 'plans', label: 'Plans', icon: <FaClipboardList size={13} /> },
                    { key: 'members', label: 'Members', icon: <FaUsers size={13} /> }
                ].map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        style={{
                            flex: 1, padding: '0.65rem', borderRadius: '10px', border: 'none',
                            background: activeTab === key ? '#fff' : 'transparent',
                            color: activeTab === key ? '#4f46e5' : '#64748b',
                            fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            boxShadow: activeTab === key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {icon} {label}
                    </button>
                ))}
            </div>

            {/* ── PLANS TAB ── */}
            {activeTab === 'plans' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {plansLoading && plans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading plans...</div>
                    ) : plans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', background: '#fff', borderRadius: '16px' }}>
                            No plans found for this club. Create one below.
                        </div>
                    ) : (
                        plans.map((plan) => (
                            <div key={plan._id} style={{
                                background: '#fff', borderRadius: '16px', padding: '1.5rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                border: plan.isActive ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                                opacity: plan.isActive ? 1 : 0.75
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <div style={{ color: '#0284c7', fontSize: '1.2rem' }}>{getIcon(plan.icon)}</div>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b' }}>{plan.title}</h3>
                                            <div style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '0.85rem' }}>{plan.price}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 'bold', background: plan.isActive ? '#dcfce7' : '#f1f5f9', color: plan.isActive ? '#166534' : '#64748b' }}>
                                            {plan.isActive ? 'Active' : 'Draft'}
                                        </span>
                                        {plan.isPremium && <span style={{ fontSize: '0.7rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><FaCrown size={10} /> Premium</span>}
                                    </div>
                                </div>

                                {plan.description && <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>{plan.description}</p>}

                                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {plan.features?.map((feature, idx) => (
                                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#64748b' }}>
                                            <FaCheck size={9} color="#0284c7" /> {feature}
                                        </li>
                                    ))}
                                </ul>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button variant="secondary" fullWidth style={{ fontSize: '0.85rem', height: '2.5rem' }} onClick={() => handleOpenEdit(plan)}>
                                        <FaEdit /> Edit
                                    </Button>
                                    <Button variant="danger" style={{ width: '40px', height: '2.5rem', minWidth: 'auto', padding: 0, background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(plan._id)}>
                                        <FaTrash size={13} />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Create New Plan button */}
                    <button
                        onClick={handleOpenCreate}
                        style={{ background: 'none', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '1.5rem', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%' }}
                    >
                        <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaPlus />
                        </div>
                        <span style={{ fontWeight: '600' }}>Create New Plan</span>
                    </button>
                </div>
            )}

            {/* ── MEMBERS TAB ── */}
            {activeTab === 'members' && (
                <div>
                    {/* Status filter */}
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        {['all', 'active', 'pending', 'inactive', 'expired'].map(s => (
                            <button
                                key={s}
                                onClick={() => setMemberFilter(s)}
                                style={{
                                    padding: '0.4rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                    fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', textTransform: 'capitalize',
                                    background: memberFilter === s ? '#4f46e5' : '#e2e8f0',
                                    color: memberFilter === s ? 'white' : '#64748b',
                                    flexShrink: 0
                                }}
                            >
                                {s}
                            </button>
                        ))}
                        <button onClick={fetchMemberships} style={{ marginLeft: 'auto', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', flexShrink: 0 }}>
                            ↻
                        </button>
                    </div>

                    {membersLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading members...</div>
                    ) : filteredMemberships.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', background: '#fff', borderRadius: '16px' }}>
                            No memberships found{memberFilter !== 'all' ? ` with status "${memberFilter}"` : ''}.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredMemberships.map(m => {
                                const ss = statusStyle(m.status);
                                const isActing = actionLoading === m._id;
                                return (
                                    <div key={m._id} style={{ background: '#fff', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                        {/* User info row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold', flexShrink: 0 }}>
                                                    {m.userId?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b' }}>{m.userId?.name || 'Unknown'}</div>
                                                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{m.userId?.email}</div>
                                                </div>
                                            </div>
                                            <span style={{ ...ss, padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'capitalize', flexShrink: 0 }}>
                                                {m.status}
                                            </span>
                                        </div>

                                        {/* Plan + expiry */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px dashed #f1f5f9', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Plan: <strong style={{ color: '#4f46e5' }}>{m.planId?.title || 'Standard'}</strong></span>
                                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                {m.expiresAt ? `Expires ${new Date(m.expiresAt).toLocaleDateString()}` : 'No expiry'}
                                            </span>
                                        </div>

                                        {/* Action buttons */}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {m.status !== 'active' && (
                                                <button
                                                    disabled={isActing}
                                                    onClick={() => handleActivate(m._id)}
                                                    style={{
                                                        flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none',
                                                        background: '#dcfce7', color: '#166534', fontWeight: '700',
                                                        cursor: 'pointer', fontSize: '0.82rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                                        opacity: isActing ? 0.6 : 1
                                                    }}
                                                >
                                                    <FaPlay size={11} /> {isActing ? 'Working...' : 'Activate'}
                                                </button>
                                            )}
                                            {m.status === 'active' && (
                                                <button
                                                    disabled={isActing}
                                                    onClick={() => handleDeactivate(m._id)}
                                                    style={{
                                                        flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none',
                                                        background: '#fee2e2', color: '#991b1b', fontWeight: '700',
                                                        cursor: 'pointer', fontSize: '0.82rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                                        opacity: isActing ? 0.6 : 1
                                                    }}
                                                >
                                                    <FaPause size={11} /> {isActing ? 'Working...' : 'Deactivate'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Plan Create / Edit Modal ── */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
                    <div style={{ backgroundColor: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{isCreating ? 'Create Plan' : 'Edit Plan'}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748b', cursor: 'pointer' }}>
                                <FaTimes />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={mLabel}>Plan Title</label>
                                <input type="text" name="title" required value={formData.title} onChange={handleInputChange} style={mInput} placeholder="e.g. Gold Membership" />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={mLabel}>Price</label>
                                    <input type="text" name="price" required value={formData.price} onChange={handleInputChange} style={mInput} placeholder="e.g. $150/yr" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={mLabel}>Duration (Months)</label>
                                    <input type="number" name="durationMonths" required value={formData.durationMonths} onChange={handleInputChange} style={mInput} />
                                </div>
                            </div>
                            <div>
                                <label style={mLabel}>Description</label>
                                <textarea name="description" required value={formData.description} onChange={handleInputChange} style={{ ...mInput, minHeight: '70px' }} placeholder="Briefly describe the plan" />
                            </div>
                            <div>
                                <label style={mLabel}>Features</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {formData.features.map((feature, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="text" value={feature} onChange={e => { const nf = [...formData.features]; nf[idx] = e.target.value; setFormData(p => ({ ...p, features: nf })); }} style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }} placeholder="e.g. Access to gym" />
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, features: p.features.filter((_, i) => i !== idx) }))} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setFormData(p => ({ ...p, features: [...p.features, ''] }))} style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#64748b', borderRadius: '10px', padding: '0.5rem', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                                        + Add Feature
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={mLabel}>Icon</label>
                                    <select name="icon" value={formData.icon} onChange={handleInputChange} style={{ ...mInput, background: '#fff' }}>
                                        <option value="FaStar">Star</option>
                                        <option value="FaCrown">Crown</option>
                                        <option value="FaGem">Gem</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                                    {[['isPremium', 'Premium Plan'], ['isActive', 'Active']].map(([name, lbl]) => (
                                        <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                                            <input type="checkbox" name={name} checked={formData[name]} onChange={handleInputChange} /> {lbl}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <Button type="submit" variant="primary" fullWidth style={{ marginTop: '0.5rem', height: '3.5rem' }}>
                                {isCreating ? 'Create Plan' : 'Update Plan'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const mLabel = { display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.35rem', color: '#475569' };
const mInput = { width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' };

export default MembershipPlans;
