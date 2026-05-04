import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FaChevronLeft, FaCreditCard, FaReceipt } from 'react-icons/fa';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payments');
            setPayments(res.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'succeeded': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'failed': return '#ef4444';
            default: return '#64748b';
        }
    };

    return (
        <div style={{ padding: '1.5rem', minHeight: '100vh', background: '#f8fafc' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'white', border: 'none', padding: '0.75rem', borderRadius: '12px', display: 'flex', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                >
                    <FaChevronLeft color="#1e293b" />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Payment History</h1>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading transactions...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {payments.map((payment) => (
                        <div key={payment._id} style={{
                            background: 'white',
                            padding: '1.25rem',
                            borderRadius: '20px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '14px',
                                    background: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FaReceipt color="#6366f1" size={20} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '1rem' }}>
                                        {payment.planId?.title || 'Membership'}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {payment.clubId?.name} • {new Date(payment.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '1.1rem' }}>
                                    ${payment.amount.toFixed(2)}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '6px',
                                    background: `${getStatusColor(payment.status)}15`,
                                    color: getStatusColor(payment.status)
                                }}>
                                    {payment.status}
                                </span>
                            </div>
                        </div>
                    ))}

                    {payments.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            background: 'white',
                            borderRadius: '30px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaCreditCard size={28} color="#cbd5e1" />
                            </div>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500' }}>No transactions yet.</p>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Join a club to see your payment history here.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Payments;
