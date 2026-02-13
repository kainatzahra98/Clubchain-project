import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { FaChevronLeft, FaQuestionCircle, FaEnvelope } from 'react-icons/fa';
import api from '../../utils/api';

const HelpCenter = () => {
    const navigate = useNavigate();

    const faqs = [
        { q: "How do I join a club?", a: "Go to Explore, find a club you like, view details, and select a membership plan." },
        { q: "Can I cancel my membership?", a: "Yes, go to Profile > My Memberships and click Leave on any active club." },
        { q: "How do I get an Intro Letter?", a: "Go to Intro Letter in the menu, fill out the request form, and wait for approval." }
    ];

    const [showContactForm, setShowContactForm] = React.useState(false);
    const [contactData, setContactData] = React.useState({ email: '', message: '' });
    const [submitting, setSubmitting] = React.useState(false);
    const [status, setStatus] = React.useState(null);

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);
        try {
            await api.post('/support', contactData);
            setStatus({ type: 'success', message: 'Message sent! Our team will get back to you shortly.' });
            setContactData({ email: '', message: '' });
            setTimeout(() => setShowContactForm(false), 3000);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send message. Please try again later.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                    <FaChevronLeft />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Help Center</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Card>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaQuestionCircle style={{ color: '#8b5cf6' }} /> FAQ
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {faqs.map((faq, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                                <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{faq.q}</h4>
                                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    {!showContactForm ? (
                        <>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Still need help?</h3>
                            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                Our support team is here for you. We typically respond within 24 hours.
                            </p>
                            <Button variant="primary" fullWidth style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }} onClick={() => setShowContactForm(true)}>
                                <FaEnvelope /> Contact Support
                            </Button>
                        </>
                    ) : (
                        <form onSubmit={handleContactSubmit}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Send us a message</h3>

                            {status && (
                                <div style={{
                                    padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem',
                                    backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
                                    color: status.type === 'success' ? '#166534' : '#991b1b'
                                }}>
                                    {status.message}
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: '600' }}>Your Email</label>
                                <input
                                    type="email"
                                    required
                                    value={contactData.email}
                                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '10px',
                                        border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem'
                                    }}
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: '600' }}>Message</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={contactData.message}
                                    onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                                    style={{
                                        width: '100%', padding: '0.75rem', borderRadius: '10px',
                                        border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem',
                                        resize: 'none'
                                    }}
                                    placeholder="How can we help you?"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button variant="outline" type="button" style={{ flex: 1 }} onClick={() => setShowContactForm(false)} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit" style={{ flex: 2 }} disabled={submitting}>
                                    {submitting ? 'Sending...' : 'Send Message'}
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default HelpCenter;
