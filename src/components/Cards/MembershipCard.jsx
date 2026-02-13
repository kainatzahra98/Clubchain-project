import React from 'react';
import './MembershipCard.css';

const MembershipCard = ({ title, price, features, tier, status }) => {
    return (
        <div className={`membership-card ${tier}`}>
            <div className="card-inner">
                {status && (
                    <span className={`status-badge ${status.toLowerCase()}`}>
                        {status}
                    </span>
                )}
                <h3 className="card-title">{title}</h3>
                <div className="card-price">
                    <span className="currency">$</span>
                    <span className="amount">{price}</span>
                    <span className="period">/mo</span>
                </div>
                <ul className="card-features">
                    {features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                    ))}
                </ul>
                <button className="card-btn">Choose Plan</button>
            </div>
        </div>
    );
};

export default MembershipCard;
