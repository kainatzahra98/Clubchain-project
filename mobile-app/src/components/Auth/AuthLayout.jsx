import React from 'react';
import './AuthLayout.css';
import logo from '../../assets/logo.png';

const AuthLayout = ({ children, role = 'client', title, subtitle }) => {
    // role can be 'client', 'club-admin', 'system-admin'
    const themeClass = role === 'client' ? 'theme-dark' : 'theme-hybrid';

    return (
        <div className={`auth-layout ${themeClass}`}>
            <div className="auth-container animate-slide-up">
                <div className="auth-card glass">
                    <div className="auth-header">
                        <img src={logo} alt="ClubChain" className="auth-logo" style={{
                            height: '70px',
                            marginBottom: '1.5rem',
                            filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.2))'
                        }} />
                        <h2>{title}</h2>
                        <p>{subtitle}</p>
                    </div>
                    <div className="auth-body">
                        {children}
                    </div>
                </div>
                <div className="auth-footer">
                    <p>&copy; 2025 ClubChain Premium. Luxury Redefined.</p>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
