import React, { useEffect, useState, useCallback } from 'react';
import { useFile } from '../../context/fileContext';
import { Hash } from '@bsv/sdk';
import { getTransactionByFileHash } from '../../hooks/transactions';
import type { FileContent } from '../../types/index';

interface OverlayResponse {
    outputs: unknown[];
}

function FilePreview({ fileContent }: { fileContent: FileContent }) {
    switch (fileContent.type) {
        case 'image':
            return <img src={fileContent.content} alt="Preview" style={{ maxWidth: '100%', borderRadius: '6px' }} />;
        case 'pdf':
            return <embed src={fileContent.content} width="100%" height="600px" title="PDF Preview" />;
        case 'audio':
            return <audio controls src={fileContent.content} style={{ width: '100%' }} />;
        case 'video':
            return <video controls src={fileContent.content} style={{ maxWidth: '100%', borderRadius: '6px' }} />;
        case 'text':
            return <pre>{fileContent.content}</pre>;
        default:
            return <p style={{ color: '#aaa' }}>No preview available for this file type.</p>;
    }
}

function Verify() {
    const { files, fileContent, setFilePath, setFiles, handleCancel } = useFile();
    const [response, setResponse] = useState<OverlayResponse | null>(null);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    useEffect(() => {
        setFiles([]);
        setFilePath('');
    }, []);

    const handleVerify = async () => {
        if (!fileContent) return;
        setVerifyError(null);
        try {
            const fileHash = Hash.sha256(fileContent.bytes);
            const result = await getTransactionByFileHash(fileHash);
            setResponse(result);
        } catch (err) {
            setVerifyError('Could not reach the overlay network. Check your connection and try again.');
            console.error("Verify query failed:", err);
        }
    };

    const handleSelectFiles = async () => {
        if (window.electronAPI?.openDialog) {
            const selected = await window.electronAPI.openDialog();
            if (selected && selected.length > 0) {
                console.log("selected", selected);
                setFiles([selected]);
                setFilePath(selected);
            }
        } else {
            console.error("Electron API not available");
        }
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0] as File & { path: string };
        console.log("droppedFile", droppedFile);
        if (droppedFile && droppedFile.path) {
            setFilePath(droppedFile.path);
            setFiles([droppedFile.path]);
        }
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    if (verifyError) {
        return (
            <div className="main-container">
                <div className="content-block file-picker-block">
                    <h1 className="block-header">File Integrity</h1>
                    <p className="not-verified">Overlay query failed</p>
                    <p style={{ color: '#888', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>{verifyError}</p>
                    <div className="button-container">
                        <button className="action-button cancel" onClick={() => { setVerifyError(null); }}>Try Again</button>
                    </div>
                </div>
            </div>
        );
    }

    if (response) {
        return (
            <div className="main-container">
                <div className="content-block file-picker-block">
                    <h1 className="block-header">File Integrity</h1>
                    {fileContent && (
                        <div className="file-preview custom-scrollbar">
                            <h3>Preview:</h3>
                            <FilePreview fileContent={fileContent} />
                        </div>
                    )}
                    {response.outputs.length > 0 ? (
                        <p className="verified">File is verified</p>
                    ) : (
                        <p className="not-verified">File is not verified</p>
                    )}
                    <div className="button-container">
                        <button
                            className="action-button cancel"
                            onClick={() => { setResponse(null); setFiles([]); setFilePath(''); }}
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="content-block file-picker-block">
                {files.length === 0 ? (
                    <>
                        <h1 className="block-header">Verify Files</h1>
                        <button className="action-button" onClick={handleSelectFiles}>Select a File</button>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`file-drop-area${isDragOver ? ' drag-over' : ''}`}
                        >
                            <h2>Drag and Drop a File Here</h2>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="block-header">Verify Files</h1>
                        {fileContent && (
                            <div className="file-preview custom-scrollbar">
                                <h3>Preview:</h3>
                                <FilePreview fileContent={fileContent} />
                            </div>
                        )}
                        <div className="button-container">
                            <button className="action-button cancel" onClick={handleCancel}>Cancel</button>
                            <button className="action-button" onClick={handleVerify}>Verify</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Verify;
