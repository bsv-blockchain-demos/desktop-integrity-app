import React, { useEffect } from 'react';
import './css/App.css';
import { Routes, Route } from 'react-router-dom';
import Homepage from './components/homepage';
import Logs from './components/logs';
import Sidebar from './components/sidebar';
import TopBar from './components/topbar';
import Verify from './components/verify';
import Recall from './components/recall';
import Help from './components/help';
import SettingsDrawer from './components/settingsDrawer';
import { useWallet } from '../context/walletContext';

function App() {
  const { initializeWallet } = useWallet();

  useEffect(() => {
    initializeWallet();
    console.log("Wallet initialized");
  }, [initializeWallet]);

  return (
    <div className="app-container">
      <TopBar />
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/recall" element={<Recall />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </main>
      <SettingsDrawer />
    </div>
  );
}

export default App;
