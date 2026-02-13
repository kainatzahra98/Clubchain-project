import React from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './MemberProfile.css';
import { FaEdit, FaEnvelope, FaMapMarkerAlt, FaCrown } from 'react-icons/fa';

const MemberProfile = () => {
    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName="John Admin" />

                <div className="dashboard-content">
                    <div className="content-container animate-slide-up">
                        <div className="profile-grid">
                            {/* Left Pane: Bio & Photo */}
                            <div className="profile-pane left-pane glass">
                                <div className="profile-photo-container">
                                    <div className="profile-photo">
                                        <img src="https://ui-avatars.com/api/?name=Alex+Johnson&background=6366f1&color=fff&size=200" alt="Alex Johnson" />
                                        <button className="edit-photo-btn"><FaEdit /></button>
                                    </div>
                                    <div className="tier-badge-large">
                                        <FaCrown /> GOLD MEMBER
                                    </div>
                                </div>

                                <div className="profile-info-basic">
                                    <h2>Alex Johnson</h2>
                                    <p className="member-id">Member ID: #CLB-8829</p>

                                    <div className="info-item">
                                        <FaEnvelope /> <span>alex.j@luxury-club.com</span>
                                    </div>
                                    <div className="info-item">
                                        <FaMapMarkerAlt /> <span>New York, NY</span>
                                    </div>
                                </div>

                                <div className="profile-bio">
                                    <h3>Biography</h3>
                                    <p>Tech entrepreneur and luxury car enthusiast. Member since 2021. Frequent traveler and hospitality advocate.</p>
                                </div>
                            </div>

                            {/* Right Pane: Form & Logs */}
                            <div className="profile-pane right-pane">
                                <div className="pane-section glass">
                                    <div className="section-header">
                                        <h3>Account Details</h3>
                                        <button className="btn-edit">Edit Profile</button>
                                    </div>
                                    <form className="profile-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>First Name</label>
                                                <input type="text" defaultValue="Alex" readOnly />
                                            </div>
                                            <div className="form-group">
                                                <label>Last Name</label>
                                                <input type="text" defaultValue="Johnson" readOnly />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <input type="email" defaultValue="alex.j@luxury-club.com" readOnly />
                                        </div>
                                        <div className="form-group">
                                            <label>Membership Tier</label>
                                            <select defaultValue="gold" disabled>
                                                <option value="silver">Silver</option>
                                                <option value="gold">Gold</option>
                                                <option value="platinum">Platinum</option>
                                            </select>
                                        </div>
                                    </form>
                                </div>

                                <div className="pane-section glass">
                                    <div className="section-header">
                                        <h3>Activity Logs</h3>
                                    </div>
                                    <div className="logs-container">
                                        <div className="log-item">
                                            <div className="log-dot"></div>
                                            <div className="log-content">
                                                <p><strong>Membership Renewed</strong> - Gold Tier Plan</p>
                                                <span>Dec 20, 2025 • 02:30 PM</span>
                                            </div>
                                        </div>
                                        <div className="log-item">
                                            <div className="log-dot"></div>
                                            <div className="log-content">
                                                <p><strong>Event Attendance</strong> - Summer Gala Night</p>
                                                <span>Aug 15, 2025 • 08:00 PM</span>
                                            </div>
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

export default MemberProfile;
