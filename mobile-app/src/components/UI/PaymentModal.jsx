import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaLock, FaTimes, FaCheckCircle } from 'react-icons/fa';
import Button from './Button';

const PaymentModal = ({ isOpen, onClose, onPaymentComplete, planName, amount }) => {
    const [step, setStep] = useState('details'); // details, processing, success
    const [formData, setFormData] = useState({
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });

    useEffect(() => {
        if (isOpen) {
            setStep('details');
            setFormData({ cardName: '', cardNumber: '', expiry: '', cvc: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStep('processing');

        // Simulate payment processing
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onPaymentComplete();
            }, 1500);
        }, 2000);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: '#fff', borderRadius: '24px', width: '90%', maxWidth: '400px',
                padding: '2rem', position: 'relative', overflow: 'hidden'
            }} className="slide-up">

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'none', border: 'none', fontSize: '1.2rem', color: '#666'
                    }}
                >
                    <FaTimes />
                </button>

                {step === 'details' && (
                    <form onSubmit={handleSubmit}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '60px', height: '60px', background: '#e0f2fe', color: '#0284c7',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1rem', fontSize: '1.5rem'
                            }}>
                                <FaLock />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Secure Payment</h3>
                            <p style={{ color: '#666' }}>Purchasing {planName}</p>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a1a2e', marginTop: '0.5rem' }}>
                                {amount}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#444' }}>Cardholder Name</label>
                                <input
                                    type="text" name="cardName" required
                                    value={formData.cardName} onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#444' }}>Card Number</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text" name="cardNumber" required
                                        value={formData.cardNumber} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem', paddingLeft: '2.5rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                        placeholder="0000 0000 0000 0000"
                                    />
                                    <FaCreditCard style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#444' }}>Expiry</label>
                                    <input
                                        type="text" name="expiry" required
                                        value={formData.expiry} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                        placeholder="MM/YY"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#444' }}>CVC</label>
                                    <input
                                        type="text" name="cvc" required
                                        value={formData.cvc} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                        placeholder="123"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            style={{ marginTop: '2rem', height: '3.5rem', fontSize: '1.1rem' }}
                            type="submit"
                        >
                            Pay {amount}
                        </Button>
                    </form>
                )}

                {step === 'processing' && (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <div className="spinner" style={{
                            width: '50px', height: '50px', border: '4px solid #f3f3f3',
                            borderTop: '4px solid #0284c7', borderRadius: '50%', margin: '0 auto 1.5rem',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <h3>Processing Payment...</h3>
                        <p style={{ color: '#666' }}>Please do not close this window</p>
                    </div>
                )}

                {step === 'success' && (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <div style={{ fontSize: '4rem', color: '#22c55e', marginBottom: '1rem' }}>
                            <FaCheckCircle />
                        </div>
                        <h3>Payment Successful!</h3>
                        <p style={{ color: '#666' }}>Welcome to the club.</p>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .slide-up { animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default PaymentModal;
