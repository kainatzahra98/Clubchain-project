import React from 'react';
import './MobileContainer.css';
import { FaHome, FaSearch, FaUser, FaBell } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const MobileContainer = ({ children, role = 'client' }) => {
    const location = useLocation();
    const themeClass = role === 'client' ? 'theme-dark' : 'theme-hybrid';

    const navItems = role === 'client'
        ? [
            { icon: <FaHome />, path: '/client-app', label: 'Home' },
            { icon: <FaSearch />, path: '/client-app/explore', label: 'Explore' },
            { icon: <FaBell />, path: '/client-app/alerts', label: 'Alerts' },
            { icon: <FaUser />, path: '/client-app/profile', label: 'Profile' }
        ]
        : [
            { icon: <FaHome />, path: '/club-admin-app', label: 'Admin' },
            { icon: <FaSearch />, path: '/club-admin-app/members', label: 'Members' },
            { icon: <FaBell />, path: '/club-admin-app/tasks', label: 'Tasks' },
            { icon: <FaUser />, path: '/club-admin-app/settings', label: 'Settings' }
        ];

    return (
        <div className={`mobile-wrapper ${themeClass}`}>
            <div className="mobile-phone-frame">
                <div className="mobile-status-bar">
                    <span className="time">9:41</span>
                    <div className="status-icons">
                        <span className="signal">📶</span>
                        <span className="wifi">⚡</span>
                        <span className="battery">🔋</span>
                    </div>
                </div>

                <div className="mobile-content">
                    {children}
                </div>

                <nav className="mobile-bottom-nav">
                    {navItems.map((item, idx) => (
                        <Link
                            key={idx}
                            to={item.path}
                            className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="android-soft-keys">
                    <div className="key back"></div>
                    <div className="key home"></div>
                    <div className="key overview"></div>
                </div>
            </div>
        </div>
    );
};

export default MobileContainer;
