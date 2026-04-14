import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTransaction } from '../hooks/transactions';
import { uploadToUHRP } from '../utils/UHRPManager';
import { useWallet } from './walletContext';
import { toast } from 'react-hot-toast';
import type { FileContent, SavedFile } from '../types/index';

interface FileContextType {
    files: string[];
    setFiles: React.Dispatch<React.SetStateAction<string[]>>;
    fileContent: FileContent | null;
    setFileContent: React.Dispatch<React.SetStateAction<FileContent | null>>;
    filePath: string;
    setFilePath: React.Dispatch<React.SetStateAction<string>>;
    savedFiles: SavedFile[];
    setSavedFiles: React.Dispatch<React.SetStateAction<SavedFile[]>>;
    uhrpEnabled: boolean;
    setUhrpEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    handleSaveToBlockchain: () => Promise<void>;
    handleCancel: () => void;
}

const FileContext = createContext<FileContextType>({} as FileContextType);
export const useFile = () => useContext(FileContext);

export function FileProvider({ children }: { children: React.ReactNode }) {
    const { wallet, localKVStore, keyID } = useWallet();
    const [files, setFiles] = useState<string[]>([]);
    const [fileContent, setFileContent] = useState<FileContent | null>(null);
    const [filePath, setFilePath] = useState<string>('');
    const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
    const [uhrpEnabled, setUhrpEnabled] = useState<boolean>(() => {
        const stored = localStorage.getItem('uhrpEnabled');
        return stored === null ? true : stored === 'true';
    });

    useEffect(() => {
        localStorage.setItem('uhrpEnabled', String(uhrpEnabled));
    }, [uhrpEnabled]);

    // Fetch file content whenever the selected file changes
    useEffect(() => {
        async function fetchContent() {
            if (files.length !== 0) {
                const content = await window.electronAPI.readFile(files[0]);
                console.log("content", content);
                setFileContent(content);
            } else {
                setFileContent(null);
            }
        }
        fetchContent();
    }, [files]);

    const handleSaveToBlockchain = async () => {
        let fileName = '';
        let existing: SavedFile[] = [];
        let time = '';

        try {
            console.log("filePath", filePath);
            fileName = filePath.split(/[/\\]/).pop() ?? '';

            existing = JSON.parse(localStorage.getItem('savedFiles') ?? '[]') as SavedFile[];

            // Check if file already exists in logs
            const logPaths = await window.electronAPI.listLogs();
            const logContents = await Promise.all(
                logPaths.map(async (p) => {
                    const file = await window.electronAPI.readFile(p);
                    return { originalName: file.name.split('-').slice(0, -1).join('-') };
                })
            );
            if (logContents.some(file => file.originalName === fileName)) {
                toast.error('File already exists', {
                    duration: 5000,
                    position: 'top-center',
                    id: 'file-exists-error',
                });
                return;
            }

            time = new Date().toLocaleString();

            const stats = await window.electronAPI.getFileStats(files[0]);
            console.log("stats", stats);

            if (existing.some(file => file.fileName === fileName)) {
                fileName = fileName + " (" + existing.length + ")";
            }
            const updated: SavedFile[] = [
                ...existing,
                { fileName, status: { txID: 'Creating...', ...(uhrpEnabled && { uhrpURL: 'Uploading...' }), time } }
            ];
            localStorage.setItem('savedFiles', JSON.stringify(updated));
            setSavedFiles(updated);

            if (!wallet) throw new Error("Wallet not connected");
            if (!localKVStore) throw new Error("Wallet not fully initialized");
            if (!fileContent) throw new Error("No file content");

            let txID: string;
            let uhrpURL: string | undefined;

            if (uhrpEnabled) {
                const encryptedFileContent = await wallet.encrypt({
                    plaintext: fileContent.bytes,
                    keyID,
                    protocolID: [0, 'fileintegrity'],
                });
                const [response, url] = await Promise.all([
                    createTransaction(fileContent.bytes, wallet, fileName),
                    uploadToUHRP(encryptedFileContent.ciphertext, wallet),
                ]);
                txID = response.txid ?? 'unknown';
                uhrpURL = url;
                await localKVStore.set(uhrpURL, keyID);
            } else {
                const response = await createTransaction(fileContent.bytes, wallet, fileName);
                txID = response.txid ?? 'unknown';
            }

            console.log("txID", txID, "uhrpURL", uhrpURL);

            const updatedStatus: SavedFile[] = updated.map((file) => {
                if (file.fileName === fileName) {
                    return { ...file, status: { txID, ...(uhrpURL && { uhrpURL }), time } };
                }
                return file;
            });
            localStorage.setItem('savedFiles', JSON.stringify(updatedStatus));
            setSavedFiles(updatedStatus);

            const fileCreatedTS = stats?.createdTS.replace('T', ' ') ?? '';
            const fileModifiedTS = stats?.modifiedTS.replace('T', ' ') ?? '';
            const cleanFileName = fileName.replace(/\s\(\d+\)$/, '');
            const originalFileSize = stats?.size ?? 0;
            const uhrpLine = uhrpURL ? `\nuhrpURL: ${uhrpURL}` : '';

            const logData = `SavedFile: ${cleanFileName}
\nTime: ${time}
\nSavedWithKeyID: ${keyID}
\nTxID: ${txID}${uhrpLine}
\nFileCreatedTS: ${fileCreatedTS}
\nFileModifiedTS: ${fileModifiedTS}
\nOriginalFileSize: ${originalFileSize}`;

            const result = await window.electronAPI.writeLog(cleanFileName, logData);
            if (result.success) {
                console.log('Log saved at', result.path);
            } else {
                console.error('Failed to save log:', result.error);
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            const failedUpdate: SavedFile[] = [
                ...existing,
                { fileName, status: { txID: 'Failed', ...(uhrpEnabled && { uhrpURL: 'Failed' }), time } }
            ];
            toast.error('Failed to save file: ' + error, {
                duration: 5000,
                position: 'top-center',
                id: 'file-save-error',
            });
            localStorage.setItem('savedFiles', JSON.stringify(failedUpdate));
            setSavedFiles(failedUpdate);
        }

        if (files.length !== 0) {
            setFiles([]);
            setFileContent(null);
        }
        setFilePath('');
    };

    useEffect(() => {
        const savedFiles = JSON.parse(localStorage.getItem('savedFiles') ?? '[]') as SavedFile[];
        setSavedFiles(savedFiles);
    }, []);

    const handleCancel = () => {
        if (files.length !== 0) {
            setFiles([]);
            setFileContent(null);
        }
        setFilePath('');
    };

    return (
        <FileContext.Provider value={{
            files,
            setFiles,
            fileContent,
            setFileContent,
            filePath,
            setFilePath,
            savedFiles,
            setSavedFiles,
            uhrpEnabled,
            setUhrpEnabled,
            handleSaveToBlockchain,
            handleCancel,
        }}>
            {children}
        </FileContext.Provider>
    );
}
