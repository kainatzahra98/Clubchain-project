import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './Payments.css';
import { FaCreditCard, FaSearch, FaFilter, FaCheckCircle, FaClock, FaTimesCircle, FaArrowUp } from 'react-icons/fa';
import api from '../../utils/api';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payments');
            setPayments(res.data || []);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'succeeded': return <FaCheckCircle />;
            case 'pending': return <FaClock />;
            case 'failed': return <FaTimesCircle />;
            case 'refunded': return <FaArrowUp />;
            default: return <FaClock />;
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

    const stats = {
        total: payments.length,
        succeeded: payments.filter(p => p.status === 'succeeded').length,
        pending: payments.filter(p => p.status === 'pending').length,
        revenue: payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + (p.amount || 0), 0)
    };

    const StatsCard = ({ title, value, icon, color }) => (
        <div className="stats-card-small" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="stats-info">
                <span className="stats-title">{title}</span>
                <span className="stats-value">{value}</span>
            </div>
            <div className="stats-icon-small" style={{ color: color, background: `${color}20` }}>
                {icon}
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName={user.name || 'Admin'} />

                <div className="dashboard-content">
                    <div className="content-container animate-slide-up">
                        <div className="payments-header">
                            <div>
                                <h1>Payments & Transactions</h1>
                                <p>Manage and monitor all membership payments and revenue.</p>
                            </div>
                        </div>

                        <div className="stats-summary-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                            <StatsCard title="Total Revenue" value={`$${stats.revenue}`} icon={<FaCreditCard />} color="#10b981" />
                            <StatsCard title="Total Payments" value={stats.total} icon={<FaSearch />} color="#6366f1" />
                            <StatsCard title="Successful" value={stats.succeeded} icon={<FaCheckCircle />} color="#8b5cf6" />
                            <StatsCard title="Pending" value={stats.pending} icon={<FaClock />} color="#f59e0b" />
                        </div>

                        {loading ? (
                            <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>Loading payments...</div>
                        ) : (
                            <>
                                <div className="management-controls glass">
                                    <div className="search-bar">
                                        <FaSearch />
                                        <input 
                                            type="text" 
                                            placeholder="Search members, plans or amounts..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="filter-actions">
                                        <button className="btn-filter"><FaFilter /> Filter</button>
                                        <select 
                                            className="status-select"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="succeeded">Successful</option>
                                            <option value="pending">Pending</option>
                                            <option value="failed">Failed</option>
                                            <option value="refunded">Refunded</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="payments-table-container">
                                    <table className="payments-table">
                                        <thead>
                                            <tr>
                                                <th>Member</th>
                                                <th>Plan</th>
                                                <th>Club</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPayments.map((payment) => (
                                                <tr key={payment._id}>
                                                    <td>
                                                        <div className="member-info">
                                                            <div className="member-avatar">{payment.userId?.name?.charAt(0)}</div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: 500 }}>{payment.userId?.name || 'Unknown'}</span>
                                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{payment.userId?.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{payment.planId?.title || 'N/A'}</td>
                                                    <td>{payment.clubId?.name || 'N/A'}</td>
                                                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                                                    <td><span style={{ fontWeight: 600 }}>${payment.amount}</span></td>
                                                    <td>
                                                        <span className={`status-badge ${payment.status}`}>
                                                            {getStatusIcon(payment.status)}
                                                            <span style={{ marginLeft: '0.4rem' }}>{payment.status}</span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredPayments.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                            No payment records found.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payments;
