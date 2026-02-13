import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FaChartPie,
    FaUsers,
    FaCalendarAlt,
    FaCog,
    FaFileAlt,
    FaChevronLeft,
    FaChevronRight,
    FaHome,
    FaCommentDots,
    FaCrown,
    FaBuilding
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ theme = 'light' }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: <FaChartPie /> },
        { name: 'Members', path: '/admin/members', icon: <FaUsers /> },
        { name: 'Clubs', path: '/admin/clubs', icon: <FaBuilding /> },
        { name: 'Feedback', path: '/admin/feedback', icon: <FaCommentDots /> },
        { name: 'Events', path: '/admin/events', icon: <FaCalendarAlt /> },
        { name: 'Membership', path: '/admin/membership-plans', icon: <FaCrown /> },
        { name: 'Intro Letters', path: '/admin/letters', icon: <FaFileAlt /> },
        { name: 'Settings', path: '/admin/settings', icon: <FaCog /> },
        { name: 'Go Home', path: '/', icon: <FaHome /> },
    ];

    return (
        <aside className={`clubchain-sidebar ${theme} ${isCollapsed ? 'collapsed' : ''}`}>
            <button
                className="collapse-toggle"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>

            <div className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!isCollapsed && <span className="nav-name">{item.name}</span>}
                    </Link>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
