import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './Management.css';
import { FaPlus, FaSearch, FaEllipsisV, FaFilter, FaTrash, FaEdit } from 'react-icons/fa';
import api from '../../utils/api';
import AddUserModal from '../../components/Modals/AddUserModal';
import EditUserModal from '../../components/Modals/EditUserModal';

const Management = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showTrash, setShowTrash] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchMembers = async () => {
        setLoading(true);
        try {
            // Updated to fetch either active members or trashed (deleted) members
            const endpoint = showTrash ? '/members?status=DELETED' : '/members';
            const response = await api.get(endpoint);
            setMembers(response.data);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [showTrash]); // Refetch when toggling Trash View

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to move this user to the trash bin?')) {
            try {
                const response = await api.delete(`/auth/users/${userId}`);
                alert(response.data.message);
                fetchMembers();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user');
            }
        }
    };

    const handlePermanentDelete = async (userId) => {
        if (window.confirm('WARNING: This will permanently delete the user from the database. This action cannot be undone. Proceed?')) {
            try {
                // Hard delete endpoint (we'll need to create this or update backend to handle hard delete)
                await api.delete(`/auth/users/${userId}?hard=true`);
                alert('User permanently deleted');
                fetchMembers();
            } catch (error) {
                console.error('Error in permanent delete:', error);
                alert('Failed to delete user permanently');
            }
        }
    };

    const handleRestoreUser = async (userId) => {
        try {
            await api.put(`/auth/users/${userId}`, { status: 'ACTIVE' });
            alert('User restored successfully');
            fetchMembers();
        } catch (error) {
            console.error('Error restoring user:', error);
            alert('Failed to restore user');
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const getRoleName = (role) => {
        return role?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Client';
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'All Roles' || getRoleName(member.role) === roleFilter;

        return matchesSearch && matchesRole;
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
                                <h1>User & Member Management</h1>
                                <p>View and manage all system users and their assignments.</p>
                            </div>
                            <div className="header-actions">
                                <button
                                    className={`btn-trash-toggle ${showTrash ? 'active' : ''}`}
                                    onClick={() => setShowTrash(!showTrash)}
                                    title={showTrash ? "Back to Members" : "View Trash Bin"}
                                >
                                    <FaTrash /> {showTrash ? "View Members" : "Trash Bin"}
                                </button>
                                <button className="btn-add-new" onClick={() => setIsModalOpen(true)}>
                                    <FaPlus /> Add New User
                                </button>
                            </div>
                        </div>

                        <div className="management-controls glass">
                            <div className="search-bar">
                                <FaSearch />
                                <input
                                    type="text"
                                    placeholder="Search members by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-actions">
                                <button className="btn-filter"><FaFilter /> Filter</button>
                                <select
                                    className="status-select"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option>All Roles</option>
                                    <option>System Admin</option>
                                    <option>Club Admin</option>
                                    <option>Client</option>
                                </select>
                            </div>
                        </div>

                        <div className="management-table-container glass">
                            {loading ? (
                                <div className="loading-state">Loading members...</div>
                            ) : (
                                <table className="management-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Account Status</th>
                                            <th>Joined Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMembers.map((member) => (
                                            <tr key={member._id}>
                                                <td>
                                                    <div className="member-cell">
                                                        <div className="mini-avatar">{member.name.charAt(0)}</div>
                                                        <div>
                                                            <div className="name">{member.name}</div>
                                                            <div className="email">{member.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`role-badge ${member.role?.toLowerCase()}`}>
                                                        {getRoleName(member.role)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="status-toggle-cell">
                                                        <span className="status-pill active">Active</span>
                                                    </div>
                                                </td>
                                                <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        {showTrash ? (
                                                            <>
                                                                <button
                                                                    className="action-btn edit"
                                                                    title="Restore User"
                                                                    onClick={() => handleRestoreUser(member._id)}
                                                                >
                                                                    <FaPlus style={{ transform: 'rotate(45deg)' }} />
                                                                </button>
                                                                <button
                                                                    className="action-btn delete"
                                                                    title="Delete Permanently"
                                                                    onClick={() => handlePermanentDelete(member._id)}
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className="action-btn edit"
                                                                    title="Edit User"
                                                                    onClick={() => handleEditClick(member)}
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                                <button
                                                                    className="action-btn delete"
                                                                    title="Delete User"
                                                                    onClick={() => handleDeleteUser(member._id)}
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </>
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

            <AddUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUserAdded={fetchMembers}
            />

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onUserUpdated={fetchMembers}
            />
        </div>
    );
};

export default Management;
