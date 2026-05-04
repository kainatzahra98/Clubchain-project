import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { FaArrowLeft, FaCreditCard, FaDollarSign, FaFilter, FaSearch, FaArrowUp, FaClock, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';
import api from '../../utils/api';

const Payments = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        if (!user || !user.token) {
            navigate('/login');
            return;
        }
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const response = await api.get('/payments');
            setPayments(response.data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'succeeded': return <FaCheckCircle color="#10b981" />;
            case 'pending': return <FaClock color="#f59e0b" />;
            case 'failed': return <FaTimesCircle color="#ef4444" />;
            case 'refunded': return <FaArrowUp color="#8b5cf6" />;
            default: return <FaClock color="#6b7280" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'succeeded': return '#dcfce7';
            case 'pending': return '#fef3c7';
            case 'failed': return '#fee2e2';
            case 'refunded': return '#ede9fe';
            default: return '#f3f4f6';
        }
    };

    const getStatusTextColor = (status) => {
        switch (status) {
            case 'succeeded': return '#166534';
            case 'pending': return '#92400e';
            case 'failed': return '#991b1b';
            case 'refunded': return '#5b21b6';
            default: return '#374151';
        }
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = 
            (payment.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.planId?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.amount || '').toString().includes(searchTerm);
        
        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const totalRevenue = payments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const successfulPayments = payments.filter(p => p.status === 'succeeded').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    if (loading) {
        return (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div>Loading payments...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
                >
                    <FaArrowLeft />
                </button>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Payment History</h2>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>All membership transactions</p>
                </div>
            </header>

            {/* Payment Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.25rem' }}>
                        ${totalRevenue.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total Revenue</div>
                </Card>
                <Card style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.25rem' }}>
                        {successfulPayments}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Successful</div>
                </Card>
                <Card style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.25rem' }}>
                        {pendingPayments}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pending</div>
                </Card>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search by member, plan, or amount..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Status</option>
                    <option value="succeeded">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                </select>
            </div>

            {/* Payment List */}
            {filteredPayments.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                        <FaCreditCard size={48} style={{ marginBottom: '1rem', color: '#e5e7eb' }} />
                        <p>No payment records found</p>
                        {searchTerm || statusFilter !== 'all' ? (
                            <Button 
                                variant="outline" 
                                style={{ marginTop: '1rem' }}
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        ) : null}
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredPayments.map((payment) => (
                        <Card key={payment._id} style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                            {payment.userId?.name || 'Unknown Member'}
                                        </span>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '12px',
                                            background: getStatusColor(payment.status),
                                            color: getStatusTextColor(payment.status)
                                        }}>
                                            {getStatusIcon(payment.status)}
                                            <span>{payment.status}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.25rem' }}>
                                        {payment.planId?.title || 'Membership Plan'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                                        ${payment.amount || 0}
                                    </div>
                                    {payment.status === 'succeeded' && (
                                        <FaArrowUp size={14} color="#10b981" style={{ marginTop: '0.25rem' }} />
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Payments;
