import React, { useState, useEffect } from 'react';
import './MobileContainer.css';
import { FaHome, FaSearch, FaUser, FaBell, FaCommentDots, FaCalendarAlt, FaCog, FaInfoCircle } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import logo from '../../assets/logo.png';

const MobileContainer = ({ children, role = 'client' }) => {
    const location = useLocation();
    const [clubStatus, setClubStatus] = useState(null);
    const themeClass = role === 'client' ? 'theme-dark' : 'theme-hybrid';

    useEffect(() => {
        if (role === 'club-admin') {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.clubId) {
                api.get(`/clubs/${user.clubId._id || user.clubId}`)
                    .then(res => setClubStatus(res.data.status))
                    .catch(() => setClubStatus('error'));
            } else {
                setClubStatus('no-club');
            }
        }
    }, [role]);

    const clientNav = [
        { icon: <FaHome />, path: '/client', label: 'Home' },
        { icon: <FaSearch />, path: '/client/explore', label: 'Explore' },
        { icon: <FaBell />, path: '/client/alerts', label: 'Alerts' },
        { icon: <FaCommentDots />, path: '/client/feedback', label: 'Feedback' },
        { icon: <FaUser />, path: '/client/profile', label: 'Profile' }
    ];

    // Full admin nav for active clubs
    const adminNavFull = [
        { icon: <FaHome />, path: '/club-admin', label: 'Club-Admin' },
        { icon: <FaSearch />, path: '/club-admin/members', label: 'Members' },
        { icon: <FaBell />, path: '/club-admin/tasks', label: 'Tasks' },
        { icon: <FaCalendarAlt />, path: '/club-admin/events', label: 'Events' },
        { icon: <FaCog />, path: '/club-admin/settings', label: 'Settings' }
    ];

    // Limited nav for pending/inactive clubs - only Settings and Status
    const adminNavLimited = [
        { icon: <FaInfoCircle />, path: '/club-admin/club-status', label: 'Status' },
        { icon: <FaCog />, path: '/club-admin/settings', label: 'Settings' }
    ];

    // For club-admin, determine which nav to show
    let navItems;
    if (role === 'client') {
        navItems = clientNav;
    } else {
        // If status is still loading (null), show full nav as default
        // This prevents the tab bar from disappearing when club is active
        if (clubStatus === null) {
            navItems = adminNavFull; // Default to full nav while loading
        } else if (clubStatus === 'active') {
            navItems = adminNavFull;
        } else {
            navItems = adminNavLimited; // pending, inactive, no-club, error
        }
    }

    return (
        <div className={`mobile-wrapper ${themeClass}`}>
            <div className="mobile-phone-frame">
                {/* Header Redesign */}
                <div style={{
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    background: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    zIndex: 10,
                    gap: '12px'
                }}>
                    <img src={logo} alt="ClubChain" style={{
                        height: '32px',
                        width: 'auto',
                        objectFit: 'contain'
                    }} />
                    <span style={{
                        fontWeight: '800',
                        fontSize: '1.25rem',
                        color: '#1e293b',
                        letterSpacing: '-0.5px'
                    }}>ClubChain</span>
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
            </div>
        </div>
    );
};

export default MobileContainer;
