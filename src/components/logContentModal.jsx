import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import '../css/modal.css';

function LogContentModal({ log, onClose }) {
    const [parsedData, setParsedData] = useState({});

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

    // Parse log content into structured data
    useEffect(() => {
        if (log && log.content) {
            const parsed = parseLogContent(log.content);
            setParsedData(parsed);
        }
    }, [log]);

    // Prevent clicks inside the modal from closing it
    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    // Parse log content into key-value pairs
    const parseLogContent = (content) => {
        const lines = content.split('\n');
        const data = {};

        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                if (key && value) {
                    data[key] = value;
                }
            }
        }

        return data;
    };

    // Copy to clipboard function
    const copyToClipboard = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard!`);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            toast.error('Failed to copy to clipboard');
        }
    };

    // Format file size from bytes to MB
    const formatFileSize = (sizeInBytes) => {
        if (!sizeInBytes || sizeInBytes === 'N/A' || sizeInBytes === 'Unknown') {
            return 'Unknown';
        }
        const sizeInMB = (parseInt(sizeInBytes) / (1024 * 1024)).toFixed(2);
        return `${sizeInMB} MB`;
    };

    // Get file icon based on extension
    const getFileIcon = (filename) => {
        if (!filename) return '📄';
        const ext = filename.split('.').pop()?.toLowerCase();
        const iconMap = {
            'txt': '📝', 'md': '📝', 'json': '📋',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
            'pdf': '📕', 'doc': '📘', 'docx': '📘',
            'zip': '📦', 'rar': '📦', '7z': '📦'
        };
        return iconMap[ext] || '📄';
    };

    if (!log) return null;

    // Organize data into sections - only include fields that exist
    const fileMetadata = {
        'File Name': parsedData['SavedFile'],
        'File Size': formatFileSize(parsedData['OriginalFileSize']),
        'Save Time': parsedData['Time'],
        'File Created': parsedData['FileCreatedTS'],
        'File Modified': parsedData['FileModifiedTS']
    };

    const blockchainMetadata = {
        'Transaction ID': parsedData['TxID'],
        'Satoshis': parsedData['Satoshis'],
        'Saved With Key ID': parsedData['SavedWithKeyID']
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content enhanced-modal" onClick={handleModalClick}>
                <div className="modal-header enhanced-header">
                    <div className="file-info">
                        <span className="file-icon">{getFileIcon(fileMetadata['File Name'])}</span>
                        <h2 className="file-name">{fileMetadata['File Name']}</h2>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body enhanced-body custom-scrollbar">
                    {/* File Metadata Section */}
                    {Object.keys(fileMetadata).length > 0 && (
                        <>
                            <div className="metadata-section">
                                <h3 className="section-title">File Information</h3>
                                <div className="metadata-grid">
                                    {Object.entries(fileMetadata).map(([key, value]) => (
                                        <div key={key} className="metadata-row">
                                            <span className="metadata-key">{key}:</span>
                                            <span className="metadata-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {(Object.keys(blockchainMetadata).length > 0 || Object.keys(contentMetadata).length > 0) && (
                                <div className="section-divider"></div>
                            )}
                        </>
                    )}

                    {/* Blockchain Metadata Section */}
                    {Object.keys(blockchainMetadata).length > 0 && (
                        <>
                            <div className="metadata-section">
                                <h3 className="section-title">Blockchain Information</h3>
                                <div className="metadata-grid">
                                    {Object.entries(blockchainMetadata).map(([key, value]) => (
                                        <div key={key} className="metadata-row">
                                            <span className="metadata-key">{key}:</span>
                                            <div className="metadata-value-container">
                                                <span className={`metadata-value ${(key === 'Transaction ID' || key === 'Saved With Key ID') ? 'monospace-value' : ''}`}>
                                                    {value}
                                                </span>
                                                {(key === 'Transaction ID' || key === 'Saved With Key ID') && (
                                                    <button
                                                        className="copy-btn"
                                                        onClick={() => copyToClipboard(value, key)}
                                                        title={`Copy ${key}`}
                                                    >
                                                        📋
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LogContentModal;