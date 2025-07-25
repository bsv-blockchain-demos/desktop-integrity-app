import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTransaction } from '../hooks/transactions';
import { useWallet } from './walletContext';
import { toast } from 'react-hot-toast';

const FileContext = createContext({});
export const useFile = () => useContext(FileContext);

export function FileProvider({ children }) {
    const { wallet, localKVStore } = useWallet();
    const [files, setFiles] = useState([]);
    const [fileContent, setFileContent] = useState('');
    const [filePath, setFilePath] = useState('');
    const [savedFiles, setSavedFiles] = useState([]);

    // Get file content
    useEffect(() => {
        async function fetchContent() {
            if (files.length !== 0) {
                const content = await window.electronAPI.readFile(files);
                console.log("content", content);
                setFileContent(content);
            }
        }
        fetchContent();
    }, [files]);

    const handleSaveToBlockchain = async () => {
        let fileName = '';
        let existing = [];
        let time = '';

        try {
            console.log("filePath", filePath);
            fileName = filePath.split(/[/\\]/).pop(); // get just the file name

            // Get existing list or initialize
            existing = JSON.parse(localStorage.getItem('savedFiles')) || [];

            // Check if file exists in logs already
            const logPaths = await window.electronAPI.listLogs();

            const logContents = await Promise.all(
                logPaths.map(async (filePath) => {
                    const file = await window.electronAPI.readFile(filePath);
                    return {
                        name: file.name,
                        content: file.content,
                        // Extract the original filename without the timestamp
                        originalName: file.name.split('-').slice(0, -1).join('-')
                    };
                })
            );
            // If fileName exists in logContents.originalName, throw error
            if (logContents.some(file => file.originalName === fileName)) {
                toast.error('File already exists', {
                    duration: 5000,
                    position: 'top-center',
                    id: 'file-exists-error',
                });
                return;
            }
            time = new Date().toLocaleString()

            // Get file stats
            const stats = await window.electronAPI.getFileStats(files);
            console.log("stats", stats);

            // Add new file name
            if (existing.some(file => file.fileName === fileName)) {
                fileName = fileName + " (" + existing.length + ")";
            }
            const updated = [...existing, { fileName, status: { txID: 'Creating...', satoshis: 'Calculating...', time } }];

            // Save back to localStorage
            localStorage.setItem('savedFiles', JSON.stringify(updated));
            setSavedFiles(updated);

            if (!wallet) {
                throw new Error("Wallet not connected");
            }

            // Save to blockchain, hash file content
            const encryptedFileContent = await wallet.encrypt({ plaintext: fileContent.content, keyID: localStorage.getItem('keyID'), protocolID: [0, 'fileintegrity'] });

            const response = await createTransaction(fileContent.content, wallet, encryptedFileContent.ciphertext, fileName);

            console.log("Response", response);
            const txID = response.txid;
            const satoshis = "2";

            // Update status
            const updatedStatus = updated.map((file) => {
                if (file.fileName === fileName) {
                    return {
                        ...file,
                        status: {
                            txID,
                            satoshis,
                            time,
                        },
                    };
                }
                return file;
            });
            localStorage.setItem('savedFiles', JSON.stringify(updatedStatus));
            console.log("updatedStatus", updatedStatus);
            setSavedFiles(updatedStatus);

            // Create file in logs folder
            const fileCreatedTS = stats.createdTS.replace('T', ' ');
            const fileModifiedTS = stats.modifiedTS.replace('T', ' ');
            const cleanFileName = fileName.replace(/\s\(\d+\)$/, '');

            const keyID = localStorage.getItem('keyID');
            const logData = `SavedFile: ${cleanFileName}
                \nTime: ${time}
                \nFileContent:\n${fileContent}
                \nSavedWithKeyID: ${keyID}
                \nTxID: ${txID}
                \nSatoshis: ${satoshis}
                \nFileCreatedTS: ${fileCreatedTS}
                \nFileModifiedTS: ${fileModifiedTS}`;

            await localKVStore.setItem(`${txID}`, keyID);

            const result = await window.electronAPI.writeLog(cleanFileName, logData);
            if (result.success) {
                console.log('Log saved at', result.path);
            } else {
                console.error('Failed to save log:', result.error);
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            // Update status failed
            const failedUpdate = [...existing, { fileName, status: { txID: 'Failed', satoshis: 'Failed', time } }];

            // Save back to localStorage
            localStorage.setItem('savedFiles', JSON.stringify(failedUpdate));
            setSavedFiles(failedUpdate);
        }

        // Set file content to empty after successful save
        if (files.length !== 0) {
            setFiles([]);
            setFileContent('');
        }
        setFilePath('');
    };

    // Get initial saved files from storage
    useEffect(() => {
        const savedFiles = JSON.parse(localStorage.getItem('savedFiles')) || [];
        setSavedFiles(savedFiles);
    }, []);

    // Reset file content on cancel button click
    const handleCancel = () => {
        if (files.length !== 0) {
            setFiles([]);
            setFileContent('');
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
            handleSaveToBlockchain,
            handleCancel
        }}>
            {children}
        </FileContext.Provider>
    );
}
