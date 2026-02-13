import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../../utils/api';

const Explore = () => {
    const navigate = useNavigate();
    const [clubs, setClubs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchClubs = async () => {
            try {
                const response = await api.get('/clubs');
                setClubs(response.data);
            } catch (err) {
                console.error('Error fetching clubs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchClubs();
    }, []);

    return (
        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Explore Clubs</h2>
                <p style={{ color: '#888' }}>Find your next destination</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading clubs...</div>
                ) : (
                    clubs.map((club) => (
                        <Card key={club._id} style={{ padding: 0, overflow: 'hidden', border: 'none' }}>
                            <div style={{ height: '120px', background: 'linear-gradient(to bottom right, #2c3e50, #bdc3c7)', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                    padding: '0.25rem 0.5rem', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem'
                                }}>
                                    <FaStar color="#ffd700" /> 4.9
                                </div>
                            </div>
                            <div style={{ padding: '1.25rem' }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{club.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    <FaMapMarkerAlt /> {club.location || 'Global'}
                                </div>
                                <Button variant="secondary" fullWidth style={{ fontSize: '0.9rem', padding: '0.5rem' }} onClick={() => navigate(`/client/clubs/${club._id}`)}>View Details</Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default Explore;
