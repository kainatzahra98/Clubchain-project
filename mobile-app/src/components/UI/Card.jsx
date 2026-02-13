import React from 'react';

const Card = ({ children, className = '', style = {}, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            ...style
        }}
        className={className}
    >
        {children}
    </div>
);

export default Card;
