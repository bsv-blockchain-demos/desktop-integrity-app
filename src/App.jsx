import React, { useEffect } from 'react';
import './css/App.css'
import { Routes, Route } from 'react-router-dom'
import Homepage from './components/homepage'
import Logs from './components/logs'
import Navbar from './components/navbar'
import Verify from './components/verify'
import Recall from './components/recall'
import { useWallet } from '../context/walletContext';

function App() {
  const { initializeWallet } = useWallet();

  // Run once on mount
  useEffect(() => {
    initializeWallet();
    console.log("Wallet initialized");
  }, [initializeWallet]);

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/recall" element={<Recall />} />
      </Routes>
    </div>
  )
}

export default App;
