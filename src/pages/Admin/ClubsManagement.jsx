import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './Management.css'; // Reuse management styles
import { FaBuilding, FaCheck, FaTimes, FaSearch, FaFilter } from 'react-icons/fa';
import api from '../../utils/api';

const ClubsManagement = () => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchClubs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/clubs');
            setClubs(response.data);
        } catch (error) {
            console.error('Error fetching clubs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClubs();
    }, []);

    const handleActivate = async (clubId) => {
        if (window.confirm('Activate this club? It will become visible to all members.')) {
            try {
                await api.put(`/clubs/${clubId}/activate`);
                alert('Club activated successfully!');
                fetchClubs();
            } catch (error) {
                console.error('Error activating club:', error);
                alert('Failed to activate club');
            }
        }
    };

    const handleDeactivate = async (clubId) => {
        if (window.confirm('Deactivate this club? Members will no longer be able to request letters for it.')) {
            try {
                await api.put(`/clubs/${clubId}`, { status: 'inactive' });
                alert('Club deactivated');
                fetchClubs();
            } catch (error) {
                console.error('Error deactivating club:', error);
                alert('Failed to deactivate club');
            }
        }
    };

    const filteredClubs = clubs.filter(club => {
        const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            club.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || club.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName={user.name || "Admin"} />

                <div className="dashboard-content">
                    <div className="content-container animate-slide-up">
                        <div className="management-header">
                            <div>
                                <h1>Club Management</h1>
                                <p>Approve and manage registered clubs and their activation status.</p>
                            </div>
                        </div>

                        <div className="management-controls glass">
                            <div className="search-bar">
                                <FaSearch />
                                <input
                                    type="text"
                                    placeholder="Search by name or location..."
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
                                    <option>All</option>
                                    <option>Active</option>
                                    <option>Pending</option>
                                    <option>Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="management-table-container glass">
                            {loading ? (
                                <div className="loading-state">Loading clubs...</div>
                            ) : (
                                <table className="management-table">
                                    <thead>
                                        <tr>
                                            <th>Club Info</th>
                                            <th>Category</th>
                                            <th>Location</th>
                                            <th>Status</th>
                                            <th>Joined Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredClubs.map((club) => (
                                            <tr key={club._id}>
                                                <td>
                                                    <div className="member-cell">
                                                        <div className="mini-avatar" style={{ background: '#3a7bd5' }}><FaBuilding color="white" /></div>
                                                        <div>
                                                            <div className="name">{club.name}</div>
                                                            <div className="email" style={{ fontSize: '0.8rem' }}>{club.description.substring(0, 40)}...</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{club.category}</td>
                                                <td>{club.location}</td>
                                                <td>
                                                    <span className={`status-pill ${club.status}`}>
                                                        {club.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>{new Date(club.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        {(club.status === 'pending' || club.status === 'inactive') ? (
                                                            <button
                                                                className="action-btn edit"
                                                                title="Approve & Activate"
                                                                onClick={() => handleActivate(club._id)}
                                                                style={{ color: '#10b981' }}
                                                            >
                                                                <FaCheck />
                                                            </button>
                                                        ) : club.status === 'active' ? (
                                                            <button
                                                                className="action-btn delete"
                                                                title="Deactivate"
                                                                onClick={() => handleDeactivate(club._id)}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="action-btn edit"
                                                                title="Re-activate"
                                                                onClick={() => handleActivate(club._id)}
                                                            >
                                                                <FaCheck />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubsManagement;
