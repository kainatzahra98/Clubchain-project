import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/Header';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-page">
            <Header mode="public" />

            <main>
                {/* Hero Section */}
                <section id="home" className="hero-section">
                    <div className="container hero-content">
                        <h1 className="hero-headline animate-slide-up">
                            ClubChain <br /> <span>System Administration</span>
                        </h1>
                        <p className="hero-description animate-slide-up">
                            Secure Executive Portal Access. Manage global club network, members, and configurations.
                        </p>
                        <div className="hero-actions animate-slide-up">
                            <Link to="/login" className="btn-teal">Login to Portal</Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="public-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-logo">ClubChain</div>
                        <p>&copy; 2025 ClubChain Premium. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
