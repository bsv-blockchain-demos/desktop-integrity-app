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

        // --- Setup: validate inputs and check for duplicates ---
        try {
            fileName = filePath.split(/[/\\]/).pop() ?? '';
            existing = JSON.parse(localStorage.getItem('savedFiles') ?? '[]') as SavedFile[];

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

            if (!wallet) throw new Error("Wallet not connected");
            if (!localKVStore) throw new Error("Wallet not fully initialized");
            if (!fileContent) throw new Error("No file content");

            time = new Date().toLocaleString();

            if (existing.some(file => file.fileName === fileName)) {
                fileName = fileName + " (" + existing.length + ")";
            }
        } catch (error) {
            console.error('Setup failed:', error);
            toast.error('Failed to save file: ' + error, {
                duration: 5000,
                position: 'top-center',
                id: 'file-save-error',
            });
            setFiles([]);
            setFileContent(null);
            setFilePath('');
            return;
        }

        // Show pending state
        const pending: SavedFile[] = [
            ...existing,
            { fileName, status: { txID: 'Creating...', ...(uhrpEnabled && { uhrpURL: 'Uploading...' }), time } }
        ];
        localStorage.setItem('savedFiles', JSON.stringify(pending));
        setSavedFiles(pending);

        const stats = await window.electronAPI.getFileStats(files[0]).catch(e => {
            console.error('Failed to get file stats:', e);
            return null;
        });

        let txID = 'Failed';
        let uhrpURL: string | undefined = uhrpEnabled ? 'Failed' : undefined;

        // --- Step 1: Blockchain transaction ---
        try {
            const response = await createTransaction(fileContent!.bytes, wallet!, fileName);
            txID = response.txid ?? 'unknown';
            console.log('Transaction created:', txID);
        } catch (error) {
            console.error('Transaction failed:', error);
            toast.error('Failed to save to blockchain: ' + error, {
                duration: 5000,
                position: 'top-center',
                id: 'tx-error',
            });
        }

        // --- Step 2: UHRP upload ---
        if (uhrpEnabled) {
            try {
                const encryptedFileContent = await wallet!.encrypt({
                    plaintext: fileContent!.bytes,
                    keyID,
                    protocolID: [0, 'fileintegrity'],
                });
                const url = await uploadToUHRP(encryptedFileContent.ciphertext, wallet!);
                uhrpURL = url;
                await localKVStore!.set(uhrpURL, keyID);
                console.log('UHRP upload complete:', uhrpURL);
            } catch (error) {
                console.error('UHRP upload failed:', error);
                toast.error('UHRP upload failed: ' + error, {
                    duration: 5000,
                    position: 'top-center',
                    id: 'uhrp-error',
                });
            }
        }

        console.log('txID:', txID, 'uhrpURL:', uhrpURL);

        // Update status with final state
        const updatedStatus: SavedFile[] = pending.map((file) => {
            if (file.fileName === fileName) {
                return { ...file, status: { txID, ...(uhrpURL !== undefined && { uhrpURL }), time } };
            }
            return file;
        });
        localStorage.setItem('savedFiles', JSON.stringify(updatedStatus));
        setSavedFiles(updatedStatus);

        // Write log regardless of step outcomes
        const fileCreatedTS = stats?.createdTS.replace('T', ' ') ?? '';
        const fileModifiedTS = stats?.modifiedTS.replace('T', ' ') ?? '';
        const cleanFileName = fileName.replace(/\s\(\d+\)$/, '');
        const originalFileSize = stats?.size ?? 0;
        const uhrpLine = uhrpURL && uhrpURL !== 'Failed' ? `\nuhrpURL: ${uhrpURL}` : '';

        const logData = `SavedFile: ${cleanFileName}
\nTime: ${time}
\nSavedWithKeyID: ${keyID}
\nTxID: ${txID}${uhrpLine}
\nFileCreatedTS: ${fileCreatedTS}
\nFileModifiedTS: ${fileModifiedTS}
\nOriginalFileSize: ${originalFileSize}`;

        const result = await window.electronAPI.writeLog(cleanFileName, logData).catch(e => ({ success: false, error: e, path: '' }));
        if (result.success) {
            console.log('Log saved at', result.path);
        } else {
            console.error('Failed to save log:', result.error);
        }

        setFiles([]);
        setFileContent(null);
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
