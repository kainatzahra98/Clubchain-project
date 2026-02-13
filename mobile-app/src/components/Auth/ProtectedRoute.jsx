import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const userString = localStorage.getItem('user');
    let user = null;

    try {
        user = userString ? JSON.parse(userString) : null;
    } catch (e) {
        console.error('ProtectedRoute: Error parsing user from localStorage', e);
    }

    // console.log('ProtectedRoute Check:', { 
    //     hasUser: !!user, 
    //     hasToken: !!user?.token, 
    //     role: user?.role,
    //     allowed: allowedRoles 
    // });

    if (!user || !user.token) {
        if (userString) {
            console.warn('ProtectedRoute: Token missing from user object. Returning to login.', { userString });
        }
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        console.warn('ProtectedRoute: Role mismatch. User role:', user.role, 'Allowed:', allowedRoles);
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
