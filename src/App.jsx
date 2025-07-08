import React, { useState, useEffect } from 'react';
import './css/App.css'
import { Routes, Route } from 'react-router-dom'
import Homepage from './components/homepage'
import Logs from './components/logs'
import Status from './components/status'
import Navbar from './components/navbar'
import { WalletProvider } from '../context/walletContext.jsx'

function App() {
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState('');
  const [droppedFiles, setDroppedFiles] = useState([]);
  const [droppedFileContent, setDroppedFileContent] = useState('');
  const [filePath, setFilePath] = useState('');

  useEffect(() => {
    async function fetchContent() {
        if (files.length !== 0) {
            const content = await window.electronAPI.readFile(files[0]);
            setFileContent(content);
        }
    }
    fetchContent();
  }, [files]);

  useEffect(() => {
    async function fetchContent() {
        if (droppedFiles.length !== 0) {
            const content = await window.electronAPI.readFile(droppedFiles[0]);
            setDroppedFileContent(content);
        }
    }
    fetchContent();
  }, [droppedFiles]);

  const handleSaveToBlockchain = () => {
    // TODO: Save to blockchain
    // TODO: Create file in logs folder
  };

  const handleCancel = () => {
    if (files.length !== 0) {
        setFiles([]);
        setFileContent('');
    }
    if (droppedFiles.length !== 0) {
        setDroppedFiles([]);
        setDroppedFileContent('');
    }
    setFilePath('');
  };

  return (
    <WalletProvider>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Homepage
            handleSaveToBlockchain={handleSaveToBlockchain}
            files={files}
            setFiles={setFiles}
            filePath={filePath}
            setFilePath={setFilePath}
            droppedFiles={droppedFiles}
            setDroppedFiles={setDroppedFiles}
            handleCancel={handleCancel}
          />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/status" element={<Status />} />
        </Routes>
      </div>
    </WalletProvider>
  )
}

export default App;
