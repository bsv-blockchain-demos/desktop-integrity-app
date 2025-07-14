import React, { useState, useEffect } from 'react'
import { useWallet } from '../../context/walletContext.jsx';
import '../css/navbar.css';
import { Link } from 'react-router-dom';

function Navbar() {
    const { wallet, initializeWallet } = useWallet();
    const [loading, setLoading] = useState(false);

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

    return (
        <nav className="navbar">
            <div className="nav-links">
                <Link to="/" className="nav-btn">Save files</Link>
                <Link to="/logs" className="nav-btn">Logs</Link>
                <Link to="/verify" className="nav-btn">Verify files</Link>
            </div>
            <button
                className={`connect-wallet-btn ${wallet ? 'connected' : ''}`}
                onClick={handleConnectWallet}
                disabled={loading || wallet}
            >
                {loading ? 'Connecting...' : wallet ? 'Wallet Connected' : 'Connect Wallet'}
            </button>
        </nav>
    )
}

export default Navbar;