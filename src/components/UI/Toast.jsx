import React, { useEffect } from 'react';
import './Toast.css';
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
            case 'success': return <FaCheckCircle className="toast-icon success" />;
            case 'error': return <FaExclamationCircle className="toast-icon error" />;
            default: return <FaInfoCircle className="toast-icon info" />;
        }
    };

    return (
        <div className={`toast-container ${type} animate-slide-in`}>
            {getIcon()}
            <span className="toast-message">{message}</span>
        </div>
    );
};

export default Toast;
