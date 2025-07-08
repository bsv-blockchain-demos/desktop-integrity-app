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
  const [filePath, setFilePath] = useState('');

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

  const handleSaveToBlockchain = () => {
    // TODO: Save to blockchain, hash file content
    // TODO: Create file in logs folder
  };

  // Reset file content on cancel button click
  const handleCancel = () => {
    if (files.length !== 0) {
        setFiles([]);
        setFileContent('');
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
            handleCancel={handleCancel}
            fileContent={fileContent}
            setFileContent={setFileContent}
          />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/status" element={<Status />} />
        </Routes>
      </div>
    </WalletProvider>
  )
}

export default App;
