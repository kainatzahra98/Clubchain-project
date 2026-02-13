import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './Dashboard.css';
import { FaUserPlus, FaCalendarCheck, FaCreditCard, FaArrowUp, FaMobileAlt } from 'react-icons/fa';
import api from '../../utils/api';

const Dashboard = () => {
    const [statsData, setStatsData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/stats');
                setStatsData(response.data);
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { title: "Total Members", value: statsData?.totalUsers || statsData?.totalMembers || "0", icon: <FaUserPlus />, trend: "+12%", color: "blue" },
        { title: "Active Clubs", value: statsData?.totalClubs || statsData?.availableClubs || "0", icon: <FaCalendarCheck />, trend: "+2", color: "indigo" },
        { title: "Monthly Revenue", value: "$42,500", icon: <FaCreditCard />, trend: "+8.4%", color: "teal" },
    ];

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName={user.name || "Admin"} />

                <div className="dashboard-content">
                    <div className="content-container animate-slide-up">
                        <header className="dashboard-header">
                            <h1>Executive Overview</h1>
                            <p>Welcome back, here's what's happening at ClubChain today.</p>

                        </header>

                        {/* Status Cards Grid */}
                        <div className="stats-grid">
                            {stats.map((stat, index) => (
                                <div key={index} className={`stat-card ${stat.color}`}>
                                    <div className="stat-icon">{stat.icon}</div>
                                    <div className="stat-details">
                                        <span className="stat-title">{stat.title}</span>
                                        <h2 className="stat-value">{stat.value}</h2>
                                    </div>
                                    <div className="stat-trend">
                                        <FaArrowUp /> {stat.trend}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="dashboard-grid">
                            {/* Recent Activity Table */}
                            <div className="dashboard-card recent-activity glass">
                                <div className="card-header">
                                    <h3>Recent System Activity</h3>
                                    <button className="view-all" onClick={() => window.location.href = '/intro-letters'}>View All</button>
                                </div>
                                <div className="activity-table">
                                    <div className="table-row table-header">
                                        <span>Subject</span>
                                        <span>Action</span>
                                        <span>Time</span>
                                        <span>Status</span>
                                    </div>
                                    {statsData?.recentActivities?.length === 0 && (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No recent activity found.</div>
                                    )}
                                    {statsData?.recentActivities?.map((item) => (
                                        <div key={item.id} className="table-row">
                                            <span className="user-cell">
                                                <div className="mini-avatar">{item.user.charAt(0)}</div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.9rem' }}>{item.user}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.type.toUpperCase()}</span>
                                                </div>
                                            </span>
                                            <span style={{ fontSize: '0.85rem' }}>{item.action}</span>
                                            <span className="time-text">{formatTime(item.time)}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span className={`badge ${item.status.toLowerCase()}`}>
                                                    {item.status}
                                                </span>
                                                {item.type === 'letter' && (
                                                    <a href="/intro-letters" title="View Detail" style={{ color: '#6366f1', marginLeft: '8px' }}><FaMobileAlt /></a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upcoming Events Card */}
                            <div className="dashboard-card upcoming-events glass">
                                <div className="card-header">
                                    <h3>Upcoming Premium Events</h3>
                                </div>
                                <div className="event-list">
                                    <div className="event-item">
                                        <div className="event-date">
                                            <span className="month">DEC</span>
                                            <span className="day">28</span>
                                        </div>
                                        <div className="event-info">
                                            <h4>Winter Gala 2025</h4>
                                            <p>Grand Ballroom • 8:00 PM</p>
                                        </div>
                                    </div>
                                    <div className="event-item">
                                        <div className="event-date">
                                            <span className="month">JAN</span>
                                            <span className="day">05</span>
                                        </div>
                                        <div className="event-info">
                                            <h4>Founder's Private Dinner</h4>
                                            <p>The Penthouse • 7:30 PM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
