import React, { useEffect } from 'react';
import { FaCheckCircle, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <FaCheckCircle color="#5ddc72" />;
            case 'error': return <FaExclamationCircle color="#ff6b6b" />;
            default: return <FaInfoCircle color="#00d2ff" />;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '80px', // Above bottom nav if exists, or just bottom
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30, 30, 40, 0.95)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '50px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            {getIcon()}
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{message}</span>
        </div>
    );
};

export default Toast;
