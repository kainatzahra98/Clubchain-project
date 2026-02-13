import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import logo from '../../assets/logo.png';

const Header = ({ mode = 'public', userName = '' }) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`clubchain-header ${isScrolled ? 'scrolled' : ''} ${mode}`}>
            <div className="container header-content">
                <div className="header-left">
                    <Link to="/" className="logo">
                        <img src={logo} alt="ClubChain" className="logo-image" style={{ height: '40px' }} />
                    </Link>
                </div>

                {/* Navigation links removed for System Admin streamlined view */}

                <div className="header-right">
                    {userName ? (
                        <div className="user-profile">
                            <span className="user-name">{userName}</span>
                            <div className="avatar">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="btn-get-started">
                            Get Started
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
