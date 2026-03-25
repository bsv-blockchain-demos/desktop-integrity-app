import React, { useState, useEffect } from 'react'
import { useWallet } from '../../context/walletContext';
import '../css/sidebar.css';
import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
    const { wallet, initializeWallet } = useWallet();
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    // Button to let users manually reconnect wallet
    const handleConnectWallet = async () => {
        if (!wallet) {
            setLoading(true);
            await initializeWallet();
            setLoading(false);
            console.log("Wallet connected");
        }
        return;
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="sidebar"> 
            <nav className="sidebar-nav">
                <Link 
                    to="/" 
                    className={`sidebar-btn ${isActive('/') ? 'active' : ''}`}
                >
                    <span className="sidebar-icon">💾</span>
                    Save Files
                </Link>
                <Link 
                    to="/logs" 
                    className={`sidebar-btn ${isActive('/logs') ? 'active' : ''}`}
                >
                    <span className="sidebar-icon">📋</span>
                    Logs
                </Link>
                <Link 
                    to="/verify" 
                    className={`sidebar-btn ${isActive('/verify') ? 'active' : ''}`}
                >
                    <span className="sidebar-icon">✅</span>
                    Verify Files
                </Link>
                <Link 
                    to="/recall" 
                    className={`sidebar-btn ${isActive('/recall') ? 'active' : ''}`}
                >
                    <span className="sidebar-icon">🔄</span>
                    Recall Files
                </Link>
            </nav>

            <div className="sidebar-footer">
                <button
                    className={`connect-wallet-btn ${wallet ? 'connected' : ''}`}
                    onClick={handleConnectWallet}
                    disabled={loading || !!wallet}
                >
                    {loading ? 'Connecting...' : wallet ? 'Wallet Connected' : 'Connect Wallet'}
                </button>
            </div>
        </div>
    )
}

export default Sidebar;
