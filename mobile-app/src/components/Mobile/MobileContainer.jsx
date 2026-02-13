import React from 'react';
import './MobileContainer.css';
import { FaHome, FaSearch, FaUser, FaBell, FaCommentDots, FaCalendarAlt } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';

const MobileContainer = ({ children, role = 'client' }) => {
    const location = useLocation();
    const themeClass = role === 'client' ? 'theme-dark' : 'theme-hybrid';

    const clientNav = [
        { icon: <FaHome />, path: '/client', label: 'Home' },
        { icon: <FaSearch />, path: '/client/explore', label: 'Explore' },
        { icon: <FaBell />, path: '/client/alerts', label: 'Alerts' },
        { icon: <FaCommentDots />, path: '/client/feedback', label: 'Feedback' },
        { icon: <FaUser />, path: '/client/profile', label: 'Profile' }
    ];

    const adminNav = [
        { icon: <FaHome />, path: '/club-admin', label: 'Club-Admin' },
        { icon: <FaSearch />, path: '/club-admin/members', label: 'Members' },
        { icon: <FaBell />, path: '/club-admin/tasks', label: 'Tasks' },
        { icon: <FaCalendarAlt />, path: '/club-admin/events', label: 'Events' },
        { icon: <FaUser />, path: '/club-admin/settings', label: 'Settings' }
    ];

    const navItems = role === 'client' ? clientNav : adminNav;

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
