import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import Toast from '../../components/UI/Toast';
import api from '../../utils/api';
import './Settings.css';
import { FaUserShield, FaBell, FaGlobe, FaSpinner } from 'react-icons/fa';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Global Settings State
    const [globalSettings, setGlobalSettings] = useState({
        platformName: '',
        supportEmail: '',
        defaultCurrency: 'USD',
        maintenanceMode: false,
        forcePasswordReset: false,
        sessionTimeout: 30
    });

    // User Preferences State
    const [userPreferences, setUserPreferences] = useState({
        twoFactorEnabled: false,
        notifications: {
            emailAlerts: true,
            newMembers: true,
            marketing: false
        }
    });

    // Fetch Settings on Mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsRes, prefsRes] = await Promise.all([
                    api.get('/settings'),
                    api.get('/settings/preferences')
                ]);

                setGlobalSettings(settingsRes.data.data);
                setUserPreferences(prefsRes.data.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching settings:", error);
                setToast({ type: 'error', message: 'Failed to load settings.' });
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const showToast = (type, message) => {
        setToast({ type, message });
    };

    const handleSaveGeneral = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/settings', {
                platformName: globalSettings.platformName,
                supportEmail: globalSettings.supportEmail,
                defaultCurrency: globalSettings.defaultCurrency,
                maintenanceMode: globalSettings.maintenanceMode
            });
            showToast('success', 'General settings updated!');
        } catch (error) {
            showToast('error', 'Failed to update settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSecurity = async () => {
        setSaving(true);
        try {
            // Save Global Security Settings
            await api.put('/settings', {
                forcePasswordReset: globalSettings.forcePasswordReset,
                sessionTimeout: Number(globalSettings.sessionTimeout)
            });

            // Save Personal Security Preferences (2FA)
            await api.put('/settings/preferences', {
                twoFactorEnabled: userPreferences.twoFactorEnabled
            });

            showToast('success', 'Security settings updated!');
        } catch (error) {
            showToast('error', 'Update failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        try {
            await api.put('/settings/preferences', {
                notifications: userPreferences.notifications
            });
            showToast('success', 'Notification preferences saved!');
        } catch (error) {
            showToast('error', 'Update failed.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard-layout">
                <Sidebar theme="light" />
                <div className="dashboard-main flex-center">
                    <FaSpinner className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-layout">
            <Sidebar theme="light" />

            <div className="dashboard-main">
                <Header mode="admin" userName="System Admin" />

                <div className="dashboard-content">
                    <div className="content-container animate-slide-up settings-container">
                        <div className="settings-header">
                            <h1>System Settings</h1>
                            <p>Manage application preferences, security, and notifications.</p>
                        </div>

                        <div className="settings-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveTab('general')}
                            >
                                <FaGlobe style={{ marginRight: '8px' }} /> General
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                <FaUserShield style={{ marginRight: '8px' }} /> Security
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notifications')}
                            >
                                <FaBell style={{ marginRight: '8px' }} /> Notifications
                            </button>
                        </div>

                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="settings-section animate-slide-up">
                                <h3 className="section-title">General Preferences</h3>
                                <form onSubmit={handleSaveGeneral}>
                                    <div className="form-group">
                                        <label>Platform Name</label>
                                        <input
                                            type="text"
                                            value={globalSettings.platformName}
                                            onChange={(e) => setGlobalSettings({ ...globalSettings, platformName: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Support Email</label>
                                        <input
                                            type="email"
                                            value={globalSettings.supportEmail}
                                            onChange={(e) => setGlobalSettings({ ...globalSettings, supportEmail: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Default Currency</label>
                                        <select
                                            value={globalSettings.defaultCurrency}
                                            onChange={(e) => setGlobalSettings({ ...globalSettings, defaultCurrency: e.target.value })}
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </select>
                                    </div>
                                    <div className="toggle-group">
                                        <div className="toggle-info">
                                            <h4>Maintenance Mode</h4>
                                            <p>Disable access for all non-admin users.</p>
                                        </div>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={globalSettings.maintenanceMode}
                                                onChange={(e) => setGlobalSettings({ ...globalSettings, maintenanceMode: e.target.checked })}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                    <button type="submit" className="btn-save" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="settings-section animate-slide-up">
                                <h3 className="section-title">Security & Access</h3>
                                <div className="toggle-group">
                                    <div className="toggle-info">
                                        <h4>Two-Factor Authentication</h4>
                                        <p>Require 2FA for your admin account.</p>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={userPreferences.twoFactorEnabled}
                                            onChange={(e) => setUserPreferences({ ...userPreferences, twoFactorEnabled: e.target.checked })}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <div className="toggle-group">
                                    <div className="toggle-info">
                                        <h4>Force Password Reset</h4>
                                        <p>Require users to reset password every 90 days.</p>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={globalSettings.forcePasswordReset}
                                            onChange={(e) => setGlobalSettings({ ...globalSettings, forcePasswordReset: e.target.checked })}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                    <label>Session Timeout (Minutes)</label>
                                    <input
                                        type="number"
                                        value={globalSettings.sessionTimeout}
                                        onChange={(e) => setGlobalSettings({ ...globalSettings, sessionTimeout: e.target.value })}
                                    />
                                </div>
                                <button type="button" className="btn-save" onClick={handleSaveSecurity} disabled={saving}>
                                    {saving ? 'Updating...' : 'Update Security'}
                                </button>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="settings-section animate-slide-up">
                                <h3 className="section-title">Notification Settings</h3>
                                <div className="toggle-group">
                                    <div className="toggle-info">
                                        <h4>Email Alerts</h4>
                                        <p>Receive emails for critical system events.</p>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={userPreferences.notifications?.emailAlerts}
                                            onChange={(e) => setUserPreferences({
                                                ...userPreferences,
                                                notifications: { ...userPreferences.notifications, emailAlerts: e.target.checked }
                                            })}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <div className="toggle-group">
                                    <div className="toggle-info">
                                        <h4>New Member Notifications</h4>
                                        <p>Notify when a new member registers.</p>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={userPreferences.notifications?.newMembers}
                                            onChange={(e) => setUserPreferences({
                                                ...userPreferences,
                                                notifications: { ...userPreferences.notifications, newMembers: e.target.checked }
                                            })}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <div className="toggle-group">
                                    <div className="toggle-info">
                                        <h4>Marketing Updates</h4>
                                        <p>Receive newsletters and product updates.</p>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={userPreferences.notifications?.marketing}
                                            onChange={(e) => setUserPreferences({
                                                ...userPreferences,
                                                notifications: { ...userPreferences.notifications, marketing: e.target.checked }
                                            })}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                                <button type="button" className="btn-save" onClick={handleSaveNotifications} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Settings;
