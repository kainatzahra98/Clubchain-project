import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './MembershipPlans.css';
import { FaCrown, FaCheck, FaGem, FaStar, FaEdit, FaPlus, FaTrash, FaPlay, FaPause, FaGlobe, FaBuilding } from 'react-icons/fa';
import api from '../../utils/api';

const MembershipPlans = () => {
    const [plans, setPlans] = React.useState([]);
    const [memberships, setMemberships] = React.useState([]);
    const [clubs, setClubs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('plans');
    const [editingPlan, setEditingPlan] = React.useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [membershipFilter, setMembershipFilter] = React.useState('active');
    const [actionLoading, setActionLoading] = React.useState(null);
    const [toast, setToast] = React.useState(null);

    // Extend-to-clubs modal state
    const [extendingPlan, setExtendingPlan] = React.useState(null);
    const [extendScope, setExtendScope] = React.useState('specific');
    const [extendClubIds, setExtendClubIds] = React.useState([]);
    const [extendLoading, setExtendLoading] = React.useState(false);

    // New plan state — supports multi-club selection
    const [newPlan, setNewPlan] = React.useState({
        title: '',
        price: '',
        description: '',
        features: [''],
        durationMonths: 12,
        icon: 'FaStar',
        isPremium: false,
        clubScope: 'specific', // 'all' or 'specific'
        selectedClubIds: []
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

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
            const [plansRes, membershipsRes, clubsRes] = await Promise.allSettled([
                api.get('/membership-plans'),
                api.get('/members/all-memberships'),
                api.get('/clubs')
            ]);
            if (plansRes.status === 'fulfilled') setPlans(plansRes.value.data);
            if (membershipsRes.status === 'fulfilled') setMemberships(membershipsRes.value.data);
            if (clubsRes.status === 'fulfilled') setClubs(clubsRes.value.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { fetchData(); }, []);

    // ─── Plan CRUD ─────────────────────────────────────────────────────────────
    const handleEdit = (plan) => setEditingPlan({ ...plan });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/membership-plans/${editingPlan._id}`, editingPlan);
            setPlans(plans.map(p => p._id === editingPlan._id ? response.data : p));
            setEditingPlan(null);
            showToast('Plan updated successfully');
        } catch (err) {
            showToast('Failed to save plan changes', 'error');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const { clubScope, selectedClubIds, ...planData } = newPlan;
        planData.features = planData.features.filter(f => f.trim() !== '');

        try {
            if (clubScope === 'all') {
                // Create one plan per active club
                const res = await api.post('/membership-plans/bulk', { ...planData, allClubs: true });
                setPlans([...res.data, ...plans]);
                showToast(`Created plan for ${res.data.length} clubs`);
            } else if (selectedClubIds.length > 1) {
                // Multiple specific clubs
                const res = await api.post('/membership-plans/bulk', { ...planData, clubIds: selectedClubIds });
                setPlans([...res.data, ...plans]);
                showToast(`Created plan for ${res.data.length} clubs`);
            } else {
                // Single club
                const res = await api.post('/membership-plans', { ...planData, clubId: selectedClubIds[0] });
                setPlans([res.data, ...plans]);
                showToast('Plan created successfully');
            }
            setIsCreateModalOpen(false);
            resetNewPlan();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to create plan', 'error');
        }
    };

    const handleDeletePlan = async (planId) => {
        if (!window.confirm('Delete this plan? Members on this plan will not be affected.')) return;
        try {
            await api.delete(`/membership-plans/${planId}`);
            setPlans(plans.filter(p => p._id !== planId));
            showToast('Plan deleted');
        } catch (err) {
            showToast('Failed to delete plan', 'error');
        }
    };

    const resetNewPlan = () => setNewPlan({
        title: '', price: '', description: '', features: [''],
        durationMonths: 12, icon: 'FaStar', isPremium: false,
        clubScope: 'specific', selectedClubIds: []
    });

    // ─── Extend Plan to Clubs ──────────────────────────────────────────────────
    const openExtendModal = (plan) => {
        setExtendingPlan(plan);
        setExtendScope('specific');
        // Pre-check clubs that already have this plan
        const existingClubIds = plans
            .filter(p => p.title === plan.title)
            .map(p => (typeof p.clubId === 'object' ? p.clubId._id : p.clubId))
            .filter(Boolean);
        // Don't pre-select the existing ones — we'll grey them out instead
        setExtendClubIds([]);
    };

    const getExistingClubIdsForPlan = (plan) => {
        if (!plan) return new Set();
        return new Set(
            plans
                .filter(p => p.title === plan.title)
                .map(p => (typeof p.clubId === 'object' ? p.clubId?._id : p.clubId))
                .filter(Boolean)
        );
    };

    const toggleExtendClub = (clubId) => {
        setExtendClubIds(prev =>
            prev.includes(clubId)
                ? prev.filter(id => id !== clubId)
                : [...prev, clubId]
        );
    };

    const handleExtend = async () => {
        if (!extendingPlan) return;
        setExtendLoading(true);
        try {
            const body = extendScope === 'all'
                ? { allClubs: true }
                : { clubIds: extendClubIds };
            const res = await api.post(`/membership-plans/${extendingPlan._id}/extend`, body);
            setPlans(prev => [...res.data.created, ...prev]);
            const msg = res.data.skipped
                ? `Added to ${res.data.created.length} clubs (${res.data.skipped} already had it)`
                : `Added to ${res.data.created.length} clubs`;
            showToast(msg);
            setExtendingPlan(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to extend plan', 'error');
        } finally {
            setExtendLoading(false);
        }
    };

    // ─── Membership Actions ────────────────────────────────────────────────────
    const filteredMemberships = React.useMemo(() => {
        if (membershipFilter === 'all') return memberships;
        return memberships.filter(m => m.status === membershipFilter);
    }, [memberships, membershipFilter]);

    const handleActivateMembership = async (membershipId) => {
        setActionLoading(membershipId);
        try {
            await api.put(`/members/${membershipId}/activate`);
            setMemberships(prev => prev.map(m => m._id === membershipId ? { ...m, status: 'active' } : m));
            showToast('Membership activated');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to activate', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeactivateMembership = async (membershipId) => {
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

    // Toggle a club in the selectedClubIds list
    const toggleClub = (clubId) => {
        setNewPlan(prev => ({
            ...prev,
            selectedClubIds: prev.selectedClubIds.includes(clubId)
                ? prev.selectedClubIds.filter(id => id !== clubId)
                : [...prev.selectedClubIds, clubId]
        }));
    };

    const statusColor = (status) => {
        if (status === 'active') return { bg: '#dcfce7', color: '#166534' };
        if (status === 'pending') return { bg: '#fef3c7', color: '#92400e' };
        if (status === 'inactive') return { bg: '#f1f5f9', color: '#64748b' };
        if (status === 'expired') return { bg: '#fee2e2', color: '#991b1b' };
        return { bg: '#e0e7ff', color: '#3730a3' };
    };

    // ─── Computed: active plans across all clubs ──────────────────────────────
    const activePlansAcrossClubs = React.useMemo(() => {
        return plans.filter(p => p.isActive !== false);
    }, [plans]);

    // Group active plans by title for the "All Plans" tab
    const groupedPlans = React.useMemo(() => {
        const map = {};
        activePlansAcrossClubs.forEach(plan => {
            const key = plan.title;
            if (!map[key]) {
                map[key] = { ...plan, clubs: [] };
            }
            const clubName = typeof plan.clubId === 'object' ? plan.clubId?.name : 'Unknown';
            map[key].clubs.push({ clubId: typeof plan.clubId === 'object' ? plan.clubId?._id : plan.clubId, clubName, planId: plan._id });
        });
        return Object.values(map);
    }, [activePlansAcrossClubs]);

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />
            <div className="dashboard-main">
                <Header mode="admin" userName="System Admin" />
                <div className="dashboard-content">
                    <div className="content-container animate-slide-up">

                        {/* Toast */}
                        {toast && (
                            <div style={{
                                position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
                                padding: '1rem 1.5rem', borderRadius: '12px', fontWeight: '600', fontSize: '0.9rem',
                                background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
                                color: toast.type === 'error' ? '#991b1b' : '#166534',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                animation: 'slideIn 0.3s ease'
                            }}>
                                {toast.message}
                            </div>
                        )}

                        {/* Header */}
                        <div className="plans-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1>Membership Management</h1>
                                <p>Create plans for clubs and manage active memberships.</p>
                            </div>
                            {activeTab === 'plans' && (
                                <button
                                    className="btn-add-new"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    <FaPlus /> Create Plan
                                </button>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="tabs-container glass" style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', padding: '0.5rem', flexWrap: 'wrap' }}>
                            {[
                                { key: 'plans', label: 'Membership Plans' },
                                { key: 'allPlans', label: 'All Active Plans' },
                                { key: 'memberships', label: 'Active Memberships' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    style={{
                                        padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none',
                                        background: activeTab === tab.key ? '#6366f1' : 'transparent',
                                        color: activeTab === tab.key ? 'white' : '#64748b',
                                        fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    {tab.label}
                                    {tab.key === 'allPlans' && <span style={{ marginLeft: '0.5rem', background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#e0e7ff', color: activeTab === tab.key ? 'white' : '#4f46e5', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700' }}>{activePlansAcrossClubs.length}</span>}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <p style={{ color: '#64748b' }}>Loading data...</p>
                            </div>
                        ) : activeTab === 'plans' ? (
                            /* ── Plans Grid ── */
                            plans.length === 0 ? (
                                <div className="empty-state">
                                    <p>No membership plans found. Create one to get started.</p>
                                </div>
                            ) : (
                                <div className="plans-container">
                                    {plans.map((plan) => (
                                        <div key={plan._id} className={`plan-card ${plan.isPremium ? 'premium' : ''}`} style={{ opacity: plan.isActive ? 1 : 0.65, position: 'relative' }}>
                                            {!plan.isActive && (
                                                <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>INACTIVE</span>
                                            )}
                                            <div className="plan-icon">{getIcon(plan.icon)}</div>
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
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                <button
                                                    className="btn-edit-plan"
                                                    style={{ flex: 1 }}
                                                    onClick={() => handleEdit(plan)}
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                <button
                                                    onClick={() => openExtendModal(plan)}
                                                    title="Add to more clubs"
                                                    style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: 'none', background: '#e0e7ff', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600', fontSize: '0.85rem' }}
                                                >
                                                    <FaGlobe />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePlan(plan._id)}
                                                    style={{ padding: '0.6rem 0.8rem', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600', fontSize: '0.85rem' }}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : activeTab === 'allPlans' ? (
                            /* ── All Active Plans Table ── */
                            <div className="memberships-table-container glass">
                                <div style={{ padding: '1rem 1.5rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                                        Showing <strong>{activePlansAcrossClubs.length}</strong> active plan(s) across all clubs — grouped by {groupedPlans.length} unique plan(s).
                                    </p>
                                    <button
                                        onClick={fetchData}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                    >
                                        ↻ Refresh
                                    </button>
                                </div>

                                {groupedPlans.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                        No active plans found.
                                    </div>
                                ) : (
                                    <div style={{ padding: '0.5rem 1rem 1.5rem' }}>
                                        {groupedPlans.map((group, gi) => (
                                            <div key={gi} style={{
                                                background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0',
                                                marginBottom: '1rem', overflow: 'hidden',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                            }}>
                                                {/* Plan header row */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                                    padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9',
                                                    background: group.isPremium ? 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)' : '#f8fafc'
                                                }}>
                                                    <div style={{ fontSize: '1.5rem', color: group.isPremium ? '#d97706' : '#6366f1' }}>
                                                        {getIcon(group.icon)}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{group.title}</h3>
                                                            {group.isPremium && (
                                                                <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '700' }}>PREMIUM</span>
                                                            )}
                                                        </div>
                                                        <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>{group.description}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#1e293b' }}>${group.price}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{group.durationMonths} month{group.durationMonths > 1 ? 's' : ''}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => openExtendModal(group)}
                                                        style={{
                                                            padding: '0.6rem 1rem', borderRadius: '10px', border: 'none',
                                                            background: '#4f46e5', color: 'white', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                            fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        <FaGlobe size={12} /> Edit Clubs
                                                    </button>
                                                </div>
                                                {/* Clubs list */}
                                                <div style={{ padding: '0.75rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {group.clubs.map((c, ci) => (
                                                            <span key={ci} style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                                padding: '0.35rem 0.85rem', borderRadius: '8px',
                                                                background: '#eef2ff', color: '#4338ca',
                                                                fontSize: '0.8rem', fontWeight: '600'
                                                            }}>
                                                                <FaBuilding size={10} /> {c.clubName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {/* Features */}
                                                    {group.features && group.features.length > 0 && (
                                                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                            {group.features.map((f, fi) => (
                                                                <span key={fi} style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                                    padding: '0.25rem 0.65rem', borderRadius: '6px',
                                                                    background: '#f0fdf4', color: '#166534',
                                                                    fontSize: '0.75rem', fontWeight: '500'
                                                                }}>
                                                                    <FaCheck size={8} /> {f}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ── Memberships Table ── */
                            <div className="memberships-table-container glass">
                                {/* Controls */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1rem 0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {['all', 'active', 'pending', 'inactive', 'expired'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setMembershipFilter(status)}
                                                style={{
                                                    padding: '0.4rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer',
                                                    fontSize: '0.8rem', fontWeight: '600', textTransform: 'capitalize',
                                                    background: membershipFilter === status ? '#6366f1' : '#f1f5f9',
                                                    color: membershipFilter === status ? 'white' : '#64748b'
                                                }}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={fetchData}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                    >
                                        ↻ Refresh
                                    </button>
                                </div>

                                <table className="management-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>User</th>
                                            <th style={{ padding: '1rem' }}>Club</th>
                                            <th style={{ padding: '1rem' }}>Plan</th>
                                            <th style={{ padding: '1rem' }}>Status</th>
                                            <th style={{ padding: '1rem' }}>Expires</th>
                                            <th style={{ padding: '1rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMemberships.map((m) => {
                                            const sc = statusColor(m.status);
                                            const isActing = actionLoading === m._id;
                                            return (
                                                <tr key={m._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', flexShrink: 0 }}>
                                                                {m.userId?.name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{m.userId?.name || 'Unknown'}</div>
                                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.userId?.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{m.clubId?.name || 'N/A'}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ fontWeight: '500', color: '#4f46e5', fontSize: '0.9rem' }}>{m.planId?.title || 'Standard'}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', background: sc.bg, color: sc.color }}>
                                                            {m.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                        {m.expiresAt ? new Date(m.expiresAt).toLocaleDateString() : 'No expiry'}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                            {m.status !== 'active' && (
                                                                <button
                                                                    disabled={isActing}
                                                                    onClick={() => handleActivateMembership(m._id)}
                                                                    title="Activate"
                                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#166534', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: isActing ? 0.6 : 1 }}
                                                                >
                                                                    <FaPlay size={10} /> {isActing ? '...' : 'Activate'}
                                                                </button>
                                                            )}
                                                            {m.status === 'active' && (
                                                                <button
                                                                    disabled={isActing}
                                                                    onClick={() => handleDeactivateMembership(m._id)}
                                                                    title="Deactivate"
                                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#991b1b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: isActing ? 0.6 : 1 }}
                                                                >
                                                                    <FaPause size={10} /> {isActing ? '...' : 'Deactivate'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredMemberships.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                        No memberships found{membershipFilter !== 'all' ? ` with status "${membershipFilter}"` : ''}.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Edit Plan Modal ── */}
            {editingPlan && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1a1a2e' }}>Edit Plan</h2>
                        <form onSubmit={handleSave}>
                            {/* Show current club */}
                            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaBuilding size={14} style={{ color: '#4f46e5' }} />
                                <span style={{ fontSize: '0.85rem', color: '#4338ca', fontWeight: '600' }}>
                                    Club: {editingPlan.clubId?.name || 'Unknown'}
                                </span>
                            </div>
                            {[
                                { label: 'Icon', type: 'select', field: 'icon', options: [['FaStar', 'Star (Silver)'], ['FaCrown', 'Crown (Gold)'], ['FaGem', 'Gem (Platinum)']] },
                            ].map(({ label, type, field, options }) => (
                                <div key={field} style={{ marginBottom: '1rem' }}>
                                    <label style={labelStyle}>{label}</label>
                                    <select value={editingPlan[field]} onChange={e => setEditingPlan({ ...editingPlan, [field]: e.target.value })} style={inputStyle}>
                                        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                            ))}
                            {[{ label: 'Plan Title', field: 'title' }, { label: 'Price (e.g. $150)', field: 'price' }].map(({ label, field }) => (
                                <div key={field} style={{ marginBottom: '1rem' }}>
                                    <label style={labelStyle}>{label}</label>
                                    <input type="text" value={editingPlan[field] || ''} onChange={e => setEditingPlan({ ...editingPlan, [field]: e.target.value })} style={inputStyle} />
                                </div>
                            ))}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Duration (Months)</label>
                                <input type="number" min="1" value={editingPlan.durationMonths || 12} onChange={e => setEditingPlan({ ...editingPlan, durationMonths: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Description</label>
                                <textarea value={editingPlan.description || ''} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} rows="3" style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Features / Access Rights</label>
                                {editingPlan.features.map((feature, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input type="text" value={feature} onChange={e => { const f = [...editingPlan.features]; f[idx] = e.target.value; setEditingPlan({ ...editingPlan, features: f }); }} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                        <button type="button" onClick={() => setEditingPlan({ ...editingPlan, features: editingPlan.features.filter((_, i) => i !== idx) })} style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}><FaTrash /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setEditingPlan({ ...editingPlan, features: [...editingPlan.features, ''] })} style={addFeatureBtn}><FaPlus /> Add Feature</button>
                            </div>
                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={editingPlan.isPremium} onChange={e => setEditingPlan({ ...editingPlan, isPremium: e.target.checked })} /> Premium
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={editingPlan.isActive !== false} onChange={e => setEditingPlan({ ...editingPlan, isActive: e.target.checked })} /> Active
                                </label>
                            </div>
                            {/* Extend to more clubs — quick link */}
                            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: '#faf5ff', borderRadius: '10px', border: '1px dashed #c4b5fd' }}>
                                <button
                                    type="button"
                                    onClick={() => { setEditingPlan(null); openExtendModal(editingPlan); }}
                                    style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <FaGlobe size={14} /> Add this plan to more clubs →
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setEditingPlan(null)} style={cancelBtn}>Cancel</button>
                                <button type="submit" style={submitBtn}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Create Plan Modal ── */}
            {isCreateModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1a1a2e' }}>Create New Plan</h2>
                        <form onSubmit={handleCreate}>
                            {/* Club Scope */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>Assign Plan To</label>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    {[['all', '🌐 All Active Clubs'], ['specific', '🏛️ Specific Club(s)']].map(([val, lbl]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setNewPlan(p => ({ ...p, clubScope: val, selectedClubIds: [] }))}
                                            style={{
                                                flex: 1, padding: '0.75rem', borderRadius: '10px', border: '2px solid',
                                                borderColor: newPlan.clubScope === val ? '#6366f1' : '#e2e8f0',
                                                background: newPlan.clubScope === val ? '#eef2ff' : 'white',
                                                color: newPlan.clubScope === val ? '#4f46e5' : '#64748b',
                                                fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
                                            }}
                                        >
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Club multi-select when scope = specific */}
                            {newPlan.clubScope === 'specific' && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={labelStyle}>Select Club(s) <span style={{ color: '#94a3b8', fontWeight: 400 }}>(tick one or more)</span></label>
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem' }}>
                                        {clubs.map(club => (
                                            <label key={club._id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.5rem', cursor: 'pointer', borderRadius: '6px', ':hover': { background: '#f8fafc' } }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newPlan.selectedClubIds.includes(club._id)}
                                                    onChange={() => toggleClub(club._id)}
                                                />
                                                <span style={{ fontSize: '0.9rem', color: '#334155' }}>{club.name}</span>
                                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: club.status === 'active' ? '#166534' : '#94a3b8' }}>{club.status}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {newPlan.selectedClubIds.length === 0 && (
                                        <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.4rem' }}>Please select at least one club.</p>
                                    )}
                                </div>
                            )}

                            {/* Icon & Title */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Icon</label>
                                <select value={newPlan.icon} onChange={e => setNewPlan(p => ({ ...p, icon: e.target.value }))} style={inputStyle}>
                                    <option value="FaStar">Star (Silver)</option>
                                    <option value="FaCrown">Crown (Gold)</option>
                                    <option value="FaGem">Gem (Platinum)</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Plan Title</label>
                                <input required type="text" placeholder="e.g. Premium Plus" value={newPlan.title} onChange={e => setNewPlan(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Price (Display)</label>
                                    <input required type="text" placeholder="e.g. $150" value={newPlan.price} onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Duration (Months)</label>
                                    <input required type="number" min="1" value={newPlan.durationMonths} onChange={e => setNewPlan(p => ({ ...p, durationMonths: e.target.value }))} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Description</label>
                                <textarea required rows="2" placeholder="Short summary..." value={newPlan.description} onChange={e => setNewPlan(p => ({ ...p, description: e.target.value }))} style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Features / Access Rights</label>
                                {newPlan.features.map((f, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input required type="text" placeholder="e.g. Priority Booking" value={f} onChange={e => { const nf = [...newPlan.features]; nf[idx] = e.target.value; setNewPlan(p => ({ ...p, features: nf })); }} style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                                        <button type="button" onClick={() => setNewPlan(p => ({ ...p, features: p.features.filter((_, i) => i !== idx) }))} style={{ padding: '0.5rem', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}><FaTrash /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setNewPlan(p => ({ ...p, features: [...p.features, ''] }))} style={addFeatureBtn}><FaPlus /> Add Feature</button>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={newPlan.isPremium} onChange={e => setNewPlan(p => ({ ...p, isPremium: e.target.checked }))} /> Mark as Premium
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => { setIsCreateModalOpen(false); resetNewPlan(); }} style={cancelBtn}>Cancel</button>
                                <button
                                    type="submit"
                                    disabled={newPlan.clubScope === 'specific' && newPlan.selectedClubIds.length === 0}
                                    style={{ ...submitBtn, opacity: (newPlan.clubScope === 'specific' && newPlan.selectedClubIds.length === 0) ? 0.5 : 1 }}
                                >
                                    {newPlan.clubScope === 'all' ? 'Create for All Clubs' : newPlan.selectedClubIds.length > 1 ? `Create for ${newPlan.selectedClubIds.length} Clubs` : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Extend Plan to Clubs Modal ── */}
            {extendingPlan && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.3rem', color: '#1a1a2e' }}>
                            <FaGlobe style={{ marginRight: '0.5rem', color: '#6366f1' }} />
                            Edit Clubs for "{extendingPlan.title}"
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                            Add this plan to more clubs. Clubs that already have this plan are greyed out.
                        </p>

                        {/* Currently assigned clubs */}
                        {(() => {
                            const existing = getExistingClubIdsForPlan(extendingPlan);
                            const assignedClubs = clubs.filter(c => existing.has(c._id));
                            return assignedClubs.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Currently Assigned ({assignedClubs.length})</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {assignedClubs.map(c => (
                                            <span key={c._id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '8px', background: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: '600' }}>
                                                <FaCheck size={10} /> {c.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Scope toggle */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={labelStyle}>Add To</label>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {[['all', '🌐 All Active Clubs'], ['specific', '🏛️ Specific Club(s)']].map(([val, lbl]) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => { setExtendScope(val); setExtendClubIds([]); }}
                                        style={{
                                            flex: 1, padding: '0.7rem', borderRadius: '10px', border: '2px solid',
                                            borderColor: extendScope === val ? '#6366f1' : '#e2e8f0',
                                            background: extendScope === val ? '#eef2ff' : 'white',
                                            color: extendScope === val ? '#4f46e5' : '#64748b',
                                            fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
                                        }}
                                    >
                                        {lbl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Club picker when specific */}
                        {extendScope === 'specific' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Select New Club(s)</label>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {clubs.map(club => {
                                        const alreadyHas = getExistingClubIdsForPlan(extendingPlan).has(club._id);
                                        return (
                                            <label key={club._id} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                                padding: '0.5rem', cursor: alreadyHas ? 'not-allowed' : 'pointer',
                                                borderRadius: '6px', opacity: alreadyHas ? 0.5 : 1
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    disabled={alreadyHas}
                                                    checked={alreadyHas || extendClubIds.includes(club._id)}
                                                    onChange={() => !alreadyHas && toggleExtendClub(club._id)}
                                                />
                                                <span style={{ fontSize: '0.9rem', color: '#334155' }}>{club.name}</span>
                                                {alreadyHas && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#166534', fontWeight: '600' }}>Already added</span>}
                                                {!alreadyHas && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: club.status === 'active' ? '#166534' : '#94a3b8' }}>{club.status}</span>}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="button" onClick={() => setExtendingPlan(null)} style={cancelBtn}>Cancel</button>
                            <button
                                onClick={handleExtend}
                                disabled={extendLoading || (extendScope === 'specific' && extendClubIds.length === 0)}
                                style={{
                                    ...submitBtn,
                                    opacity: (extendLoading || (extendScope === 'specific' && extendClubIds.length === 0)) ? 0.5 : 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}
                            >
                                <FaGlobe size={14} />
                                {extendLoading ? 'Adding...' : extendScope === 'all' ? 'Add to All Clubs' : `Add to ${extendClubIds.length} Club${extendClubIds.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Shared inline styles
const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b', fontSize: '0.875rem' };
const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', fontSize: '0.9rem' };
const addFeatureBtn = { width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600' };
const cancelBtn = { flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600', cursor: 'pointer' };
const submitBtn = { flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#4f46e5', color: 'white', fontWeight: '600', cursor: 'pointer' };

export default MembershipPlans;
