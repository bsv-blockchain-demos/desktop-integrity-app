import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import '../css/modal.css';
import type { LogEntry, LogData } from '../../types/index';

function LogContentModal({ log, onClose }: { log: LogEntry; onClose: () => void }) {
    const [parsedData, setParsedData] = useState<LogData>({});

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (log?.content) {
            setParsedData(parseLogContent(log.content));
        }
    }, [log]);

    const handleModalClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const parseLogContent = (content: string): LogData => {
        const lines = content.split('\n');
        const data: LogData = {};
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                if (key && value) data[key] = value;
            }
        }
        return data;
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard!`);
        } catch {
            toast.error('Failed to copy to clipboard');
        }
    };

    const formatFileSize = (sizeInBytes?: string) => {
        if (!sizeInBytes || sizeInBytes === 'N/A' || sizeInBytes === 'Unknown') return 'Unknown';
        const sizeInMB = (parseInt(sizeInBytes) / (1024 * 1024)).toFixed(2);
        return `${sizeInMB} MB`;
    };

    const getFileIcon = (filename?: string) => {
        if (!filename) return '📄';
        const ext = filename.split('.').pop()?.toLowerCase() ?? '';
        const iconMap: Record<string, string> = {
            'txt': '📝', 'md': '📝', 'json': '📋',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
            'pdf': '📕', 'doc': '📘', 'docx': '📘',
            'zip': '📦', 'rar': '📦', '7z': '📦',
            'mp3': '🎵', 'wav': '🎵', 'mp4': '🎬', 'avi': '🎬',
        };
        return iconMap[ext] ?? '📄';
    };

    if (!log) return null;

    const fileMetadata: Record<string, string | undefined> = {
        'File Name': parsedData['SavedFile'],
        'File Size': formatFileSize(parsedData['OriginalFileSize']),
        'Save Time': parsedData['Time'],
        'File Created': parsedData['FileCreatedTS'],
        'File Modified': parsedData['FileModifiedTS'],
    };

    const blockchainMetadata: Record<string, string | undefined> = {
        'Transaction ID': parsedData['TxID'],
        'Satoshis': parsedData['Satoshis'],
        'Saved With Key ID': parsedData['SavedWithKeyID'],
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

                    <div className="section-divider"></div>

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
                                        {(key === 'Transaction ID' || key === 'Saved With Key ID') && value && (
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
                </div>
            </div>
        </div>
    );
}

export default LogContentModal;
