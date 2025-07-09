import React, { useEffect } from 'react';
import '../css/modal.css';

function LogContentModal({ log, onClose }) {
    // Close modal when Escape key is pressed
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Prevent clicks inside the modal from closing it
    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    if (!log) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={handleModalClick}>
                <div className="modal-header">
                    <h2>{log.originalName || log.name}</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="log-content-container">
                        <h3>Log Content</h3>
                        <pre className="log-pre">{log.content}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LogContentModal;