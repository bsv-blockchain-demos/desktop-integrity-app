import React, { useState, useEffect } from 'react';
import './css/App.css'
import { Routes, Route } from 'react-router-dom'
import Homepage from './components/homepage'
import Logs from './components/logs'
import Navbar from './components/navbar'
import Verify from './components/verify'
import { toast } from 'react-hot-toast';

function App() {
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
    try {
      console.log("filePath", filePath);
      const fileName = filePath.split(/[/\\]/).pop(); // get just the file name

      // Get existing list or initialize
      const existing = JSON.parse(localStorage.getItem('savedFiles')) || [];

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

      const time = new Date().toLocaleString()

      // Get file stats
      const stats = await window.electronAPI.getFileStats(files);
      console.log("stats", stats);

      // Add new file name
      const updated = [...existing, {fileName, status: {txID: 'Creating...', satoshis: 'Calculating...', time}}];

      // Save back to localStorage
      localStorage.setItem('savedFiles', JSON.stringify(updated));
      setSavedFiles(updated);

      // TODO: Save to blockchain, hash file content
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Dummy values to test Logs
      const txID = 'txID';
      const satoshis = 101;
      const EncryptedContent = 'EncryptedContent';

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
    \nEncryptedContent:\n${EncryptedContent}
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
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage
          handleSaveToBlockchain={handleSaveToBlockchain}
          files={files}
          setFiles={setFiles}
          filePath={filePath}
          setFilePath={setFilePath}
          handleCancel={handleCancel}
          fileContent={fileContent}
          setFileContent={setFileContent}
          savedFiles={savedFiles}
        />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </div>
  )
}

export default App;
