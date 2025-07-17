import React, { useEffect, useState } from 'react';
import { useWallet } from '../../context/walletContext';
import { getTransactionByTxID } from '../../hooks/transactions';
import toast from 'react-hot-toast';

function Recall() {
    const { localKVStore, wallet } = useWallet();
    const [txid, setTxid] = useState('');
    const [decryptedContent, setDecryptedContent] = useState(null);
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        const loadLogs = async () => {
            const logs = await window.electronAPI.listLogs();
            setLogs(logs);
            console.log("logs", logs);
        }
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

            // Get txid and keyID from log
            const txid = objectContent.TxID;
            let keyID = objectContent.SavedWithKeyID;

            // If keyID doesn't exist fallback to localKVStore
            if (!keyID) {
                const localKeyID = localKVStore.getItem(txid);
                if (!localKeyID) {
                    console.error("KeyID not found");
                    return;
                }
                keyID = localKeyID;
            }

            // Get transaction by txid
            const response = await getTransactionByTxID(txid);
            console.log("response", response);

            // Get metadata from transaction
            const metadata = response.metadata;

            if (!wallet) {
                console.error("Wallet not connected");
                toast.error("Wallet not connected");
                return;
            }

            // Decrypt metadata
            const decryptedContent = await wallet.decrypt({
                protocolID: [0, 'fileintegrity'],
                keyID,
                encryptedContent: metadata,
            });

            console.log("decryptedContent", decryptedContent);
            setDecryptedContent({
                data: decryptedContent,
                filename: objectContent.SavedFile || null,
            });
            setSelectedLog(null);
        } catch (error) {
            console.error("Error getting transaction from log:", error);
            toast.error("Error getting transaction from log");
        }
    }

    async function tryRecallFromTxID(txid) {
        try {
            if (!txid) {
                console.error("No txid provided");
                return;
            } else if (txid.length !== 64) {
                console.error("Invalid txid");
                return;
            }

            // Get transaction by txid
            const response = await getTransactionByTxID(txid);
            console.log("response", response);

            // Get metadata from transaction
            const metadata = response.metadata;

            // Get keyID to decrypt file
            const keyID = localKVStore.getItem(response.txid);
            console.log("keyID", keyID);

            if (!wallet) {
                console.error("Wallet not connected");
                toast.error("Wallet not connected");
                return;
            }

            // Decrypt metadata
            const decryptedContent = await wallet.decrypt({
                protocolID: [0, 'fileintegrity'],
                keyID,
                encryptedContent: metadata,
            });

            console.log("decryptedContent", decryptedContent);
            setDecryptedContent({
                data: decryptedContent,
                filename: "file",
            });
            setSelectedLog(null);
        } catch (error) {
            console.error("Error getting transaction by txid:", error);
            toast.error("Error getting transaction by txid");
        }
    }

    // Download file
    async function downloadFile(content, fileName) {
        // Get content from binary
        const buffer = content instanceof Uint8Array ? content : new Uint8Array(content);

        // Save file
        await window.electronAPI.saveDecryptedFile(buffer, fileName);
    }

    function getPreview(decryptedContent) {
        if (!decryptedContent) return null;

        const { data, filename } = decryptedContent;
        const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);

        const blob = new Blob([buffer]);
        const url = URL.createObjectURL(blob);

        const extension = filename?.split('.').pop()?.toLowerCase();

        if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(extension)) {
            // Image preview
            return <img src={url} alt="Decrypted Image" style={{ maxWidth: '300px', marginTop: '1rem' }} />;
        }

        if (['txt', 'json', 'csv', 'md', 'html'].includes(extension)) {
            // Text preview
            return (
                <div style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto', marginTop: '1rem' }}>
                    <pre>{new TextDecoder().decode(buffer)}</pre>
                </div>
            );
        }

        // Unknown file type
        return (
            <div style={{ marginTop: '1rem' }}>
                <p>Preview not available for this file type.</p>
            </div>
        );
    }

    function parseLogContent(text) {
        const lines = text.split('\n');
        const data = {};

        for (const line of lines) {
            const [key, ...rest] = line.trim().split(':');
            if (key && rest.length) {
                data[key.trim()] = rest.join(':').trim();
            }
        }

        return data;
    }

    return (
        (!decryptedContent ? (
            <div>
                <h1>Recall</h1>
                {selectedLog === null ? (
                    <div>
                        <p>Select a log if possible</p>
                        <ul>
                            {logs.map((log) => {
                                const fileName = log.split(/[\\/]/).pop();
                                return (
                                    <li key={fileName}>
                                        <button onClick={() => setSelectedLog(log)}>{fileName}</button>
                                    </li>
                                )
                            })}
                        </ul>

                        <p>Put in txid manually if no logs</p>
                        <form onSubmit={(e) => { e.preventDefault(); tryRecallFromTxID(txid); }}>
                            <input type="text" placeholder="txid" onChange={(e) => setTxid(e.target.value)} />
                            <button type="submit">Recall</button>
                        </form>
                    </div>
                ) : (
                    <div>
                        <p>Selected Log: {selectedLog.split(/[\\/]/).pop()}</p>
                        <button onClick={() => tryRecallFromLogs()}>Recall</button>
                    </div>
                )}
            </div>
        ) : (
            <div>
                <h1>Recalled file successfully</h1>
                <p>
                    Filename: {decryptedContent.filename} <br />
                    Size: {(decryptedContent.data.length / 1024).toFixed(2)} KB
                </p>
                <p>Preview:</p>
                {getPreview(decryptedContent)}
                <p>Save file?</p>
                <button onClick={() => downloadFile(decryptedContent.data, decryptedContent.filename)}>Download</button>
                <button onClick={() => setDecryptedContent(null)}>Recall another file</button>
            </div>
        ))
    );
}

export default Recall;
