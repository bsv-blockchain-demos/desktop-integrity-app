import React, { useState, useCallback } from 'react';
import { useFile } from '../../context/fileContext.jsx';
import { Hash, Utils } from '@bsv/sdk';
import { getTransactionByFileHash } from '../../hooks/transactions';

function Verify() {
    const { files, fileContent, setFilePath, setFiles, handleCancel } = useFile();
    const [response, setResponse] = useState(null);

    const handleVerify = async () => {
        // Get file hash to compare with hash in Overlay
        const fileHash = Hash.sha256(Utils.toArray(fileContent.content), 'utf-8');
        console.log("fileHash", fileHash);

        // Get transaction by file hash
        const response = await getTransactionByFileHash(fileHash);
        console.log("response", response);
        if (response.outputs.length === 0) {
            console.error("No outputs found");
            return;
        }
        setResponse(response);
    }

    // Let user select files with dialog
    const handleSelectFiles = async () => {
        if (window.electronAPI?.openDialog) {
            const selected = await window.electronAPI.openDialog();
            if (selected && selected.length > 0) {
                console.log("selected", selected);
                setFiles(selected);
                setFilePath(selected);
            }
        } else {
            console.error("Electron API not available");
        }
    };

    // Let user drag and drop files
    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFile = e.dataTransfer.files[0];
        console.log("droppedFile", droppedFile);
        if (droppedFile && droppedFile.path) {
            setFilePath(droppedFile.path);
            setFiles(droppedFile.path);
        }
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    if (response) {
        return (
            <div className="main-container">
                <div className="content-block file-picker-block">
                    <h1 className="block-header">File Integrity</h1>
                    {files.length !== 0 && (
                        <div className="file-preview">
                            <h3>Preview:</h3>
                            {fileContent.type === 'image' ? (
                                <img
                                    src={fileContent.content}
                                    alt="Preview"
                                />
                            ) : (
                                <pre>
                                    {fileContent.content}
                                </pre>
                            )}
                        </div>
                    )}
                    {response.outputs.length > 0 ? (
                        <p>File is verified</p>
                    ) : (
                        <p>File is not verified</p>
                    )}
                    <button className="action-button cancel" onClick={() => {setResponse(null); setFiles([]); setFilePath('')}}>Exit</button>
                </div>
            </div>
        )
    }

    return (
        <div className="main-container">
            <div className="content-block file-picker-block">
                {files.length === 0 ? (
                    <>
                        <h1 className="block-header">Verify Files</h1>
                        <button className="action-button" onClick={handleSelectFiles}>Select Files/Folders</button>
                        <ul>
                            {files.map((path, index) => (
                                <li key={index}>{path}</li>
                            ))}
                        </ul>
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="file-drop-area"
                        >
                            <h2>Drag and Drop a File Here</h2>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="block-header">Verify Files</h1>
                        {files.length !== 0 && (
                            <div className="file-preview custom-scrollbar">
                                <h3>Preview:</h3>
                                {fileContent.type === 'image' ? (
                                    <img
                                        src={fileContent.content}
                                        alt="Preview"
                                    />
                                ) : (
                                    <pre>
                                        {fileContent.content}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: '1rem' }}>
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
