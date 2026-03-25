import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/walletContext';
import { getTransactionByTxID } from '../../hooks/transactions';
import { Transaction } from '@bsv/sdk';
import toast from 'react-hot-toast';
import '../css/layout.css';
import '../css/recall.css';
import type { LogData } from '../../types/index';

interface DecryptedFile {
    data: number[];
    filename: string | null;
}

function Recall() {
    const { localKVStore, wallet } = useWallet();
    const [txid, setTxid] = useState('');
    const [decryptedContent, setDecryptedContent] = useState<DecryptedFile | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [selectedLog, setSelectedLog] = useState<string | null>(null);
    const [logPreviewData, setLogPreviewData] = useState<LogData | null>(null);

    useEffect(() => {
        const loadLogs = async () => {
            const logPaths = await window.electronAPI.listLogs();

            const sortedLogs = logPaths.map((logPath) => {
                const fileName = logPath.split(/[\\/]/).pop() ?? '';
                const timestampMatch = fileName.match(/-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);

                let timestamp = new Date(0);
                if (timestampMatch) {
                    const isoTimestamp = timestampMatch[1].replace(/(\d{2})-(\d{2})-(\d{2})$/, (_, h, m, s) => `${h}:${m}:${s}`);
                    timestamp = new Date(isoTimestamp);
                }

                return { path: logPath, timestamp };
            });

            const sortedLogPaths = sortedLogs
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map(log => log.path);

            setLogs(sortedLogPaths);
        };
        loadLogs();
    }, []);

    async function tryRecallFromLogs() {
        try {
            if (!selectedLog) {
                console.error("No log selected");
                return;
            }

            const rawContent = await window.electronAPI.readFile(selectedLog);
            console.log("rawContent", rawContent);
            const objectContent = parseLogContent(rawContent.content);
            console.log("objectContent", objectContent);

            const txid = objectContent.TxID;
            let keyID = objectContent.SavedWithKeyID;

            if (!txid) {
                toast.error("TxID not found in log");
                return;
            }

            if (!keyID) {
                const localKeyID = await localKVStore.get(txid);
                if (!localKeyID) {
                    console.error("KeyID not found");
                    toast.error("KeyID not found");
                    return;
                }
                keyID = localKeyID as string;
            }

            const response = await getTransactionByTxID(txid);
            console.log("response", response);

            if (response.outputs.length === 0) {
                console.error("No outputs found");
                toast.error("No transaction found");
                return;
            }

            const transaction = Transaction.fromBEEF((response.outputs[0] as { beef: number[] }).beef);
            console.log("transaction", transaction);

            const metadata = (transaction.metadata as Map<string, number[]>).get('OffChainValues');
            console.log("metadata", metadata);

            if (!wallet) {
                console.error("Wallet not connected");
                toast.error("Wallet not connected");
                return;
            }

            const { plaintext } = await wallet.decrypt({
                protocolID: [0, 'fileintegrity'],
                keyID,
                ciphertext: metadata ?? [],
            });

            console.log("decryptedContent", plaintext);
            setDecryptedContent({
                data: plaintext,
                filename: objectContent.SavedFile ?? null,
            });
            setSelectedLog(null);
        } catch (error) {
            console.error("Error getting transaction from log:", error);
            toast.error("Error getting transaction from log");
        }
    }

    async function tryRecallFromTxID(txid: string) {
        try {
            if (!txid) {
                toast.error("No txid provided");
                return;
            } else if (txid.length !== 64) {
                toast.error("Invalid txid");
                return;
            }

            const response = await getTransactionByTxID(txid);
            console.log("response", response);

            if (response.outputs.length === 0) {
                toast.error("No transaction found");
                return;
            }

            const transaction = Transaction.fromBEEF((response.outputs[0] as { beef: number[] }).beef);
            console.log("transaction", transaction);

            const metadata = (transaction.metadata as Map<string, number[]>).get('OffChainValues');
            console.log("metadata", metadata);

            const keyID = await localKVStore.get(txid);
            console.log("keyID", keyID);

            if (!wallet) {
                toast.error("Wallet not connected");
                return;
            }

            const { plaintext } = await wallet.decrypt({
                protocolID: [0, 'fileintegrity'],
                keyID: keyID as string,
                ciphertext: metadata ?? [],
            });

            console.log("decryptedContent", plaintext);
            setDecryptedContent({ data: plaintext, filename: "file" });
            setSelectedLog(null);
        } catch (error) {
            console.error("Error getting transaction by txid:", error);
            toast.error("Error getting transaction by txid");
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

    return (
        <div className="main-container">
            <div className="content-block recall-container custom-scrollbar">
                {!decryptedContent ? (
                    <div>
                        <h1 className="block-header">Recall Files</h1>

                        {selectedLog === null ? (
                            <div>
                                <div className="recall-section">
                                    <h2 className="block-header">Select a log</h2>
                                    <div className="status-table-container custom-scrollbar">
                                        <table className="status-table logs-table">
                                            <thead className="table-head">
                                                <tr><th>File Name</th></tr>
                                            </thead>
                                            <tbody>
                                                {logs.length > 0 ? (
                                                    logs.map((log) => {
                                                        const fileName = log.split(/[\\/]/).pop();
                                                        return (
                                                            <tr key={fileName} onClick={() => {
                                                                setSelectedLog(log);
                                                                loadLogPreview(log);
                                                            }}>
                                                                <td>{fileName}</td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr className="empty-row">
                                                        <td>No log files found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="recall-section">
                                    <h2 className="block-header">Recall by Transaction ID</h2>
                                    <form className="recall-form" onSubmit={(e) => { e.preventDefault(); tryRecallFromTxID(txid); }}>
                                        <input
                                            className="recall-input"
                                            type="text"
                                            placeholder="Enter transaction ID"
                                            onChange={(e) => setTxid(e.target.value)}
                                        />
                                        <button className="recall-button" type="submit">Recall</button>
                                    </form>
                                </div>
                            </div>
                        ) : (
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
                                        <button className="action-button small-button" onClick={() => tryRecallFromLogs()}>Recall File</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <h1 className="block-header">Recalled File</h1>
                        <div className="recalled-file-container">
                            <div className="recalled-file-info">
                                <h3>File Information</h3>
                                <p>
                                    <strong>Filename:</strong> {decryptedContent.filename} <br />
                                    <strong>Size:</strong> {(decryptedContent.data.length / 1024).toFixed(2)} KB
                                </p>
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
                )}
            </div>
        </div>
    );
}

export default Recall;
