import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { FaChevronLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const QRScanner = () => {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [scanner, setScanner] = useState(null);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        const qrScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        qrScanner.render(onScanSuccess, onScanFailure);
        setScanner(qrScanner);

        return () => {
            qrScanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode scanner. ", error);
            });
        };
    }, []);

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (scanner) {
            scanner.clear();
        }

        try {
            // Verify with backend
            const res = await api.post('/intro-letters/verify', { token: decodedText });
            const data = res.data;
            // Ensure we have the letterId for acceptance
            if (data.isValid && !data.letterId) {
                // If it's not in the top level, we might have it in the letter object or we can decode it from token if needed
                // But let's assume the backend now returns it as requested
            }
            setScanResult(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Verification Failed');
            setScanResult(null);
        }
    };

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const handleReset = () => {
        window.location.reload(); // Simple reload to restart scanner for now
    };

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#333' }}>
                    <FaChevronLeft />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Scan QR Code</h1>
            </div>

            {!scanResult && !error && (
                <Card>
                    <div id="reader" width="100%"></div>
                    <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
                        Point camera at the Member's Intro Letter QR Code.
                    </p>
                </Card>
            )}

            {scanResult && (
                <Card style={{ textAlign: 'center', padding: '2rem' }}>
                    <FaCheckCircle size={60} color="#10b981" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Valid Entry</h2>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{scanResult.member.name}</p>
                    <p style={{ color: '#666' }}>{scanResult.member.homeClub}</p>

                    <div style={{ margin: '1.5rem 0', textAlign: 'left', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                        <p style={{ marginBottom: '0.5rem' }}><strong>Purpose:</strong> {scanResult.letter.purpose}</p>
                        <p style={{ marginBottom: '0.5rem' }}><strong>Visit Date:</strong> {new Date(scanResult.letter.visitDate).toLocaleDateString()}</p>
                        <p style={{ marginBottom: '1rem' }}><strong>Expires:</strong> {new Date(scanResult.letter.expiryDate).toLocaleDateString()}</p>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                            <p style={{ fontWeight: 'bold', color: '#6366f1', marginBottom: '0.5rem' }}>Membership: {scanResult.member.plan}</p>
                            <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <strong>Status:</strong>
                                <span style={{
                                    padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                                    background: scanResult.member.status === 'active' ? '#ecfdf5' : '#fef2f2',
                                    color: scanResult.member.status === 'active' ? '#059669' : '#ef4444'
                                }}>
                                    {scanResult.member.status}
                                </span>
                                {scanResult.member.expiresAt && <span style={{ color: '#666', fontSize: '0.8rem' }}>(Exp: {new Date(scanResult.member.expiresAt).toLocaleDateString()})</span>}
                            </div>

                            <ul style={{ fontSize: '0.85rem', color: '#475569', paddingLeft: '1.2rem', marginBottom: '1rem' }}>
                                {(scanResult.member.features || []).map((feature, i) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>

                            {scanResult.member.notes && (
                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#b45309', marginBottom: '0.2rem', textTransform: 'uppercase' }}>Home Club Notes</p>
                                    <p style={{ fontSize: '0.9rem', color: '#78350f', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{scanResult.member.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ border: '1px solid #e0e7ff', background: '#eef2ff', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '0.9rem', color: '#4338ca', marginBottom: '0.5rem' }}>
                            <strong>Identity Check Required:</strong> Please verify the member's physical identification card matches the name above.
                        </p>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', justifyContent: 'center', fontWeight: 'bold' }}>
                            <input type="checkbox" id="id-checked" style={{ width: '1.2rem', height: '1.2rem' }} /> I have verified the ID
                        </label>
                    </div>

                    <Button
                        fullWidth
                        loading={accepting}
                        onClick={async () => {
                            const checked = document.getElementById('id-checked').checked;
                            if (!checked) {
                                alert('Please verify the physical ID first.');
                                return;
                            }

                            try {
                                setAccepting(true);
                                await api.put(`/intro-letters/${scanResult.letterId}/accept`);
                                alert('Visit successfully accepted!');
                                handleReset();
                            } catch (err) {
                                console.error(err);
                                alert(err.response?.data?.message || 'Failed to accept visit');
                            } finally {
                                setAccepting(false);
                            }
                        }}
                    >Confirm & Finalize</Button>
                </Card>
            )}

            {error && (
                <Card style={{ textAlign: 'center', padding: '2rem' }}>
                    <FaTimesCircle size={60} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Invalid Entry</h2>
                    <p style={{ color: '#ef4444', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{error}</p>
                    <Button fullWidth onClick={handleReset} variant="secondary">Try Again</Button>
                </Card>
            )}

        </div>
    );
};

export default QRScanner;
