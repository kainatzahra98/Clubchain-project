import React, { useState } from 'react';
import Modal from './Modal';
import api from '../../utils/api';

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'CLIENT'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/register', formData);
            onUserAdded();
            onClose();
            setFormData({ name: '', email: '', password: '', role: 'CLIENT' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New User">
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        minLength="6"
                    />
                </div>
                <div className="form-group">
                    <label>Role</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="status-select"
                        style={{ width: '100%', marginTop: '5px' }}
                    >
                        <option value="CLIENT">Client</option>
                        <option value="CLUB_ADMIN">Club Admin</option>
                        <option value="SYSTEM_ADMIN">System Admin</option>
                    </select>
                </div>
                {error && <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                <button type="submit" className="btn-auth-submit" disabled={loading} style={{ marginTop: '20px' }}>
                    {loading ? 'Adding...' : 'Create User'}
                </button>
            </form>
        </Modal>
    );
};

export default AddUserModal;
