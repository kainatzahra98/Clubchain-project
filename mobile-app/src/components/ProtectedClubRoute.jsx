import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const ProtectedClubRoute = ({ children }) => {
    const location = useLocation();
    const [clubStatus, setClubStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const checkClubStatus = async () => {
            try {
                if (user.clubId) {
                    const clubRes = await api.get(`/clubs/${user.clubId._id || user.clubId}`);
                    setClubStatus(clubRes.data.status);
                } else {
                    // No club yet - allow access to create-club
                    setClubStatus('no-club');
                }
            } catch (err) {
                console.error('Error checking club status:', err);
                setClubStatus('error');
            } finally {
                setLoading(false);
            }
        };

        checkClubStatus();
    }, []);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    }

    // Allow access to these pages regardless of club status
    const allowedPaths = [
        '/club-admin/settings',
        '/club-admin/club-status',
        '/club-admin/create-club',
        '/club-admin/edit-club'
    ];

    const currentPath = location.pathname;

    // Always allow access to allowed paths
    if (allowedPaths.some(path => currentPath.startsWith(path))) {
        return children;
    }

    // If no club created yet, redirect to create-club
    if (clubStatus === 'no-club') {
        return <Navigate to="/club-admin/create-club" replace />;
    }

    // If club is pending or inactive, redirect to status page
    if (clubStatus === 'pending' || clubStatus === 'inactive') {
        return <Navigate to="/club-admin/club-status" replace />;
    }

    // Club is active - allow access to all pages
    return children;
};

export default ProtectedClubRoute;
