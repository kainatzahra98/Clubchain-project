import React from 'react';

const Button = ({ children, variant = 'primary', onClick, style = {}, fullWidth = false, type = 'button', disabled = false }) => {
    const baseStyle = {
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : 'auto',
        textAlign: 'center',
        ...style
    };

    const variants = {
        primary: {
            background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)'
        },
        secondary: {
            background: 'rgba(0, 0, 0, 0.05)',
            color: '#333',
            border: '1px solid rgba(0, 0, 0, 0.1)'
        },
        outline: {
            background: 'transparent',
            color: '#3a7bd5',
            border: '1px solid #3a7bd5'
        },
        danger: {
            background: 'rgba(220, 53, 69, 0.2)',
            color: '#ff6b6b',
            border: '1px solid rgba(220, 53, 69, 0.3)'
        },
        success: {
            background: 'rgba(40, 167, 69, 0.2)',
            color: '#5ddc72',
            border: '1px solid rgba(40, 167, 69, 0.3)'
        }
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{ ...baseStyle, ...variants[variant], ...(disabled && { opacity: 0.6, cursor: 'not-allowed' }) }}
        >
            {children}
        </button>
    );
};

export default Button;
