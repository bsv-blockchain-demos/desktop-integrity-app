import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../context/walletContext';
import { getTransactionByTxID } from '../../hooks/transactions';
import toast from 'react-hot-toast';
import '../css/layout.css';
import '../css/recall.css';
import type { LogData } from '../../types/index';

interface DecryptedFile {
    data: number[];
    filename: string | null;
    sourceTxid: string;
}

interface ParsedLog {
    path: string;
    originalName: string;
    timestamp: Date;
    displayTimestamp: string;
}

function Recall() {
    const { localKVStore, wallet } = useWallet();
    const [txid, setTxid] = useState('');
    const [decryptedContent, setDecryptedContent] = useState<DecryptedFile | null>(null);
    const [parsedLogs, setParsedLogs] = useState<ParsedLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<string | null>(null);
    const [logPreviewData, setLogPreviewData] = useState<LogData | null>(null);
    const [activeTab, setActiveTab] = useState<'logs' | 'txid'>('logs');
    const [isRecalling, setIsRecalling] = useState(false);

    useEffect(() => {
        const loadLogs = async () => {
            const logPaths = await window.electronAPI.listLogs();
            const parsed = logPaths.map((logPath): ParsedLog => {
                const fileName = logPath.split(/[\\/]/).pop() ?? '';
                const timestampMatch = fileName.match(/-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
                let timestamp = new Date(0);
                let displayTimestamp = 'Unknown';
                if (timestampMatch) {
                    const iso = timestampMatch[1].replace(/(\d{2})-(\d{2})-(\d{2})$/, (_, h, m, s) => `${h}:${m}:${s}`);
                    timestamp = new Date(iso);
                    displayTimestamp = timestamp.toLocaleString();
                }
                const originalName = fileName.replace(/-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.txt$/, '');
                return { path: logPath, originalName, timestamp, displayTimestamp };
            }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setParsedLogs(parsed);
        };
        loadLogs();
    }, []);

    async function tryRecallFromLogs() {
        if (!selectedLog) return;
        setIsRecalling(true);
        try {
            const rawContent = await window.electronAPI.readFile(selectedLog);
            const objectContent = parseLogContent(rawContent.content);
            const txID = objectContent.TxID;
            let keyID = objectContent.SavedWithKeyID;

            if (!txID) {
                toast.error("TxID not found in log");
                return;
            }
            if (!keyID) {
                if (!localKVStore) { toast.error("Wallet not fully initialized"); return; }
                const localKeyID = await localKVStore.get(txID);
                if (!localKeyID) {
                    toast.error("KeyID not found");
                    return;
                }
                keyID = localKeyID as string;
            }

            const response = await getTransactionByTxID(txID);
            if (response.outputs.length === 0) {
                toast.error("No transaction found");
                return;
            }

            const metadata = response.outputs[0].context;

            if (!wallet) {
                toast.error("Wallet not connected");
                return;
            }

            const { plaintext } = await wallet.decrypt({
                protocolID: [0, 'fileintegrity'],
                keyID,
                ciphertext: metadata ?? [],
            });

            setDecryptedContent({
                data: plaintext,
                filename: objectContent.SavedFile ?? null,
                sourceTxid: txID,
            });
            setSelectedLog(null);
        } catch (error) {
            console.error("Error getting transaction from log:", error);
            toast.error("Error getting transaction from log");
        } finally {
            setIsRecalling(false);
        }
    }

    async function tryRecallFromTxID(txidInput: string) {
        if (!txidInput) { toast.error("No txid provided"); return; }
        if (txidInput.length !== 64) { toast.error("Invalid txid"); return; }
        setIsRecalling(true);
        try {
            const response = await getTransactionByTxID(txidInput);
            if (response.outputs.length === 0) {
                toast.error("No transaction found");
                return;
            }

            const metadata = response.outputs[0].context;
            if (!localKVStore) { toast.error("Wallet not fully initialized"); return; }
            const keyID = await localKVStore.get(txidInput);

            if (!wallet) {
                toast.error("Wallet not connected");
                return;
            }

            const { plaintext } = await wallet.decrypt({
                protocolID: [0, 'fileintegrity'],
                keyID: keyID as string,
                ciphertext: metadata ?? [],
            });

            setDecryptedContent({ data: plaintext, filename: "file", sourceTxid: txidInput });
        } catch (error) {
            console.error("Error getting transaction by txid:", error);
            toast.error("Error getting transaction by txid");
        } finally {
            setIsRecalling(false);
        }
    }

    async function downloadFile(content: number[], fileName: string | null) {
        const buffer = new Uint8Array(content);
        await window.electronAPI.saveDecryptedFile(buffer, fileName ?? 'recalled_file');
    }

    function getPreview(dc: DecryptedFile) {
        const { data, filename } = dc;
        const buffer = new Uint8Array(data);
        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);
        const ext = filename?.split('.').pop()?.toLowerCase() ?? '';

        if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg', 'ico'].includes(ext)) {
            return <img src={url} alt="Decrypted Image" style={{ maxWidth: '300px', marginTop: '1rem' }} />;
        }
        if (ext === 'pdf') {
            return <embed src={url} width="100%" height="400px" title="Decrypted PDF" style={{ marginTop: '1rem' }} />;
        }
        if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'].includes(ext)) {
            return <audio controls src={url} style={{ width: '100%', marginTop: '1rem' }} />;
        }
        if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
            return <video controls src={url} style={{ maxWidth: '100%', marginTop: '1rem' }} />;
        }
        if (['txt', 'json', 'csv', 'md', 'html', 'xml', 'yaml', 'yml', 'ts', 'js', 'py'].includes(ext)) {
            return (
                <div style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto', marginTop: '1rem' }}>
                    <pre>{new TextDecoder().decode(buffer)}</pre>
                </div>
            );
        }
        return <p style={{ marginTop: '1rem' }}>Preview not available for this file type.</p>;
    }

    function parseLogContent(text: string): LogData {
        const lines = text.split('\n');
        const data: LogData = {};
        for (const line of lines) {
            const [key, ...rest] = line.trim().split(':');
            if (key && rest.length) {
                data[key.trim()] = rest.join(':').trim();
            }
        }
        return data;
    }

    const loadLogPreview = async (logPath: string) => {
        try {
            const rawContent = await window.electronAPI.readFile(logPath);
            setLogPreviewData(parseLogContent(rawContent.content));
        } catch (error) {
            console.error('Error loading log preview:', error);
            setLogPreviewData(null);
        }
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
            'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️', 'gif': '🖼️', 'webp': '🖼️', 'svg': '🖼️',
            'pdf': '📕', 'doc': '📄', 'docx': '📄', 'txt': '📝', 'md': '📝',
            'json': '📊', 'csv': '📊', 'xml': '📊',
            'zip': '📦', 'rar': '📦', '7z': '📦',
            'mp4': '🎬', 'avi': '🎬', 'mkv': '🎬', 'mp3': '🎵', 'wav': '🎵',
        };
        return iconMap[ext] ?? '📄';
    };

    if (decryptedContent) {
        return (
            <div className="main-container">
                <div className="content-block recall-container custom-scrollbar">
                    <h1 className="block-header">Recalled File</h1>
                    <div className="recalled-file-container">
                        <div className="recalled-file-info">
                            <h3>File Information</h3>
                            <p>
                                <strong>Filename:</strong> {decryptedContent.filename}<br />
                                <strong>Size:</strong> {(decryptedContent.data.length / 1024).toFixed(2)} KB
                            </p>
                            <div className="metadata-row" style={{ marginTop: '0.75rem' }}>
                                <span className="metadata-label">Source Transaction:</span>
                                <div className="metadata-value-container">
                                    <span className="metadata-value monospace-value">
                                        {decryptedContent.sourceTxid.substring(0, 20)}...
                                    </span>
                                    <button className="copy-btn" onClick={() => copyToClipboard(decryptedContent.sourceTxid, 'Transaction ID')} title="Copy Transaction ID">📋</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3>Preview</h3>
                            <div className="recalled-file-preview">
                                {getPreview(decryptedContent)}
                            </div>
                        </div>

                        <div className="recalled-file-actions">
                            <button className="recall-button" onClick={() => downloadFile(decryptedContent.data, decryptedContent.filename)}>Download File</button>
                            <button className="recall-button secondary" onClick={() => setDecryptedContent(null)}>Recall Another File</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedLog !== null) {
        return (
            <div className="main-container">
                <div className="content-block recall-container custom-scrollbar">
                    <h1 className="block-header">Recall Files</h1>
                    <div className="log-preview-container">
                        <div className="log-preview-card">
                            <div className="log-preview-header">
                                <div className="file-info">
                                    <span className="file-icon">{getFileIcon(logPreviewData?.SavedFile)}</span>
                                    <div className="file-details">
                                        <h3 className="file-name">{logPreviewData?.SavedFile ?? 'Unknown File'}</h3>
                                        <span className="file-size">{formatFileSize(logPreviewData?.OriginalFileSize)}</span>
                                    </div>
                                </div>
                                <div className="log-status">
                                    <span className="status-badge">Ready to Recall</span>
                                </div>
                            </div>

                            <div className="log-preview-content">
                                <div className="log-metadata">
                                    <div className="metadata-row">
                                        <span className="metadata-label">Save Time:</span>
                                        <span className="metadata-value">{logPreviewData?.Time ?? 'Unknown'}</span>
                                    </div>
                                    <div className="metadata-row">
                                        <span className="metadata-label">Transaction ID:</span>
                                        <div className="metadata-value-container">
                                            <span className="metadata-value monospace-value">
                                                {logPreviewData?.TxID ? `${logPreviewData.TxID.substring(0, 16)}...` : 'Unknown'}
                                            </span>
                                            {logPreviewData?.TxID && (
                                                <button className="copy-btn" onClick={() => copyToClipboard(logPreviewData.TxID!, 'Transaction ID')} title="Copy Transaction ID">📋</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="metadata-row">
                                        <span className="metadata-label">Key ID:</span>
                                        <div className="metadata-value-container">
                                            <span className="metadata-value monospace-value">
                                                {logPreviewData?.SavedWithKeyID ?? 'Unknown'}
                                            </span>
                                            {logPreviewData?.SavedWithKeyID && (
                                                <button className="copy-btn" onClick={() => copyToClipboard(logPreviewData.SavedWithKeyID!, 'Key ID')} title="Copy Key ID">📋</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="log-preview-actions">
                                <button className="action-button small-button cancel" onClick={() => { setSelectedLog(null); setLogPreviewData(null); }}>Cancel</button>
                                <button className="action-button small-button" onClick={tryRecallFromLogs} disabled={isRecalling}>
                                    {isRecalling ? <span className="recall-spinner" /> : 'Recall File'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="content-block recall-container custom-scrollbar">
                <h1 className="block-header">Recall Files</h1>

                <div className="recall-tabs">
                    <button
                        className={`recall-tab${activeTab === 'logs' ? ' active' : ''}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        From Logs
                    </button>
                    <button
                        className={`recall-tab${activeTab === 'txid' ? ' active' : ''}`}
                        onClick={() => setActiveTab('txid')}
                    >
                        From Transaction ID
                    </button>
                </div>

                {activeTab === 'logs' && (
                    <div className="recall-tab-content">
                        {parsedLogs.length === 0 ? (
                            <div className="recall-empty-state">
                                <p className="empty-state-text">No saved files yet.</p>
                                <p className="empty-state-hint">
                                    <Link to="/" className="empty-state-link">Save a file to the blockchain</Link> first, then come back to recall it.
                                </p>
                            </div>
                        ) : (
                            <div className="status-table-container custom-scrollbar">
                                <table className="status-table logs-table">
                                    <thead className="table-head">
                                        <tr>
                                            <th>File Name</th>
                                            <th>Saved At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedLogs.map((log) => (
                                            <tr key={log.path} onClick={() => {
                                                setSelectedLog(log.path);
                                                loadLogPreview(log.path);
                                            }}>
                                                <td>{log.originalName}</td>
                                                <td className="timestamp">{log.displayTimestamp}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'txid' && (
                    <div className="recall-tab-content">
                        <p className="recall-tab-description">Enter a transaction ID to recall a file directly from the blockchain.</p>
                        <form className="recall-form" onSubmit={(e) => { e.preventDefault(); tryRecallFromTxID(txid); }}>
                            <input
                                className="recall-input"
                                type="text"
                                placeholder="Enter transaction ID (64 hex characters)"
                                onChange={(e) => setTxid(e.target.value)}
                            />
                            <button className="recall-button" type="submit" disabled={isRecalling}>
                                {isRecalling ? <span className="recall-spinner" /> : 'Recall'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Recall;
