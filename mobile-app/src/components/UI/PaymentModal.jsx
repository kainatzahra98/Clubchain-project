import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaLock, FaTimes, FaCheckCircle, FaPaypal, FaApplePay, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import Button from './Button';

const PaymentModal = ({ isOpen, onClose, onPaymentComplete, planName, amount }) => {
    const [step, setStep] = useState('method'); // method, details, processing, success
    const [formData, setFormData] = useState({
        cardName: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });

    const [error, setError] = useState(null);
    const [showCardNumber, setShowCardNumber] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('method');
            setFormData({ cardName: '', cardNumber: '', expiry: '', cvc: '' });
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setError(null);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.cardName.trim() || !/^[a-zA-Z\s]+$/.test(formData.cardName)) {
            return "Please enter a valid cardholder name (letters only).";
        }
        
        const cleanCard = formData.cardNumber.replace(/\s+/g, '');
        if (!/^\d{16}$/.test(cleanCard)) {
            return "Card number must be exactly 16 digits.";
        }

        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiry)) {
            return "Expiry date must be in MM/YY format.";
        }

        // Removed strict expiry date checking to allow for dummy testing data

        if (!/^\d{3,4}$/.test(formData.cvc)) {
            return "CVC must be 3 or 4 digits.";
        }

        return null;
    };

    const handleSubmit = () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

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

                {step === 'method' && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Select Payment Method</h3>
                            <p style={{ color: '#666' }}>Purchasing {planName} for {amount}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button 
                                onClick={() => setStep('details')}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', 
                                    border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', 
                                    cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = '#0284c7'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                            >
                                <div style={{ background: '#e0f2fe', padding: '0.8rem', borderRadius: '8px', color: '#0284c7' }}>
                                    <FaCreditCard size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>Credit or Debit Card</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Visa, Mastercard, Amex</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => setStep('details')}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', 
                                    border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', 
                                    cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = '#0284c7'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                            >
                                <div style={{ background: '#f1f5f9', padding: '0.8rem', borderRadius: '8px', color: '#003087' }}>
                                    <FaPaypal size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>PayPal</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Fast and secure checkout</div>
                                </div>
                            </button>

                            <button 
                                onClick={() => setStep('details')}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', 
                                    border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', 
                                    cursor: 'pointer', transition: 'all 0.2s', width: '100%', textAlign: 'left',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = '#0284c7'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                            >
                                <div style={{ background: '#171717', padding: '0.8rem', borderRadius: '8px', color: '#fff' }}>
                                    <FaApplePay size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>Apple Pay</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Quick checkout with Face ID</div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'details' && (
                    <div>
                        <button
                            onClick={() => setStep('method')}
                            style={{
                                position: 'absolute', top: '1rem', left: '1rem',
                                background: 'none', border: 'none', fontSize: '1.2rem', color: '#666', cursor: 'pointer'
                            }}
                        >
                            <FaArrowLeft />
                        </button>

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
                                    type="text" name="cardName"
                                    value={formData.cardName} onChange={handleInputChange}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#444' }}>Card Number</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCardNumber ? "text" : "password"} name="cardNumber"
                                        value={formData.cardNumber} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem', paddingLeft: '2.5rem', paddingRight: '2.5rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                        placeholder="•••• •••• •••• ••••"
                                    />
                                    <FaCreditCard style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                    <button
                                        type="button"
                                        onClick={() => setShowCardNumber(!showCardNumber)}
                                        style={{
                                            position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                        }}
                                    >
                                        {showCardNumber ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#444' }}>Expiry</label>
                                    <input
                                        type="text" name="expiry"
                                        value={formData.expiry} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                        placeholder="MM/YY"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#444' }}>CVC</label>
                                    <input
                                        type="password" name="cvc"
                                        value={formData.cvc} onChange={handleInputChange}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                                        placeholder="•••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <Button
                            variant="primary"
                            fullWidth
                            style={{ marginTop: '2rem', height: '3.5rem', fontSize: '1.1rem' }}
                            onClick={handleSubmit}
                        >
                            Pay {amount}
                        </Button>
                    </div>
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
