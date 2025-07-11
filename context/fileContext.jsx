import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from './walletContext';
import { toast } from 'react-hot-toast';

const FileContext = createContext({});
export const useFile = () => useContext(FileContext);

export function FileProvider({ children }) {
    const { wallet } = useWallet();
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

            if (existing.includes(fileName)) {
                console.log("File already saved");
                // Show modal to user that file is already saved
                toast.error('File already saved', {
                    duration: 3000,
                    position: 'center',
                    id: 'file-saved-error',
                });
                // Give option to update file
                if (files.length !== 0) {
                    setFiles([]);
                    setFileContent('');
                }
                setFilePath('');
                return;
            }

            // Check if file exists in logs already

            time = new Date().toLocaleString()

            // Get file stats
            const stats = await window.electronAPI.getFileStats(files);
            console.log("stats", stats);

            // Add new file name
            const updated = [...existing, { fileName, status: { txID: 'Creating...', satoshis: 'Calculating...', time } }];

            // Save back to localStorage
            localStorage.setItem('savedFiles', JSON.stringify(updated));
            setSavedFiles(updated);

            if (!wallet) {
                throw new Error("Wallet not connected");
            }

            // Save to blockchain, hash file content
            const encryptedFileContent = await wallet.encrypt({ plaintext: fileContent.content, keyID: localStorage.getItem('keyID'), protocolID: [0, 'fileintegrity'] });

            console.log("encryptedFileContent", encryptedFileContent.ciphertext);

            const decryptedFileContent = await wallet.decrypt({ ciphertext: encryptedFileContent.ciphertext, keyID: localStorage.getItem('keyID'), protocolID: [0, 'fileintegrity'] });
            console.log("decryptedFileContent", decryptedFileContent);
            return;
            const response = await createTransaction(fileContent.content);

            const txID = response.txID;
            const satoshis = response.satoshis;

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

            const keyID = localStorage.getItem('keyID');
            const logData = `SavedFile: ${fileName}
                \nTime: ${time}
                \nEncryptedContent:\n${fileContent}
                \nSavedWithKeyID: ${keyID}
                \nTxID: ${txID}
                \nSatoshis: ${satoshis}
                \nFileCreatedTS: ${fileCreatedTS}
                \nFileModifiedTS: ${fileModifiedTS}`;

            const result = await window.electronAPI.writeLog(fileName, logData);
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
