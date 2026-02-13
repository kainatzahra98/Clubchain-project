import React from 'react';
import './LoadingOverlay.css';
import logo from '../../assets/logo.png';

const LoadingOverlay = () => {
    return (
        <div className="loading-overlay">
            <div className="loading-content">
                <img src={logo} alt="ClubChain" className="loading-logo" style={{ height: '50px', marginBottom: '1rem' }} />
                <p>Loading...</p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
