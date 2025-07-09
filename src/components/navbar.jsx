import React, { useState } from 'react'
import { useWallet } from '../../context/walletContext.jsx';
import '../css/navbar.css';

function Navbar() {
    const { wallet, initializeWallet } = useWallet();
    const [loading, setLoading] = useState(false);

    // Button to let users manually reconnect wallet
    const handleConnectWallet = async () => {
        if (!wallet) {
            setLoading(true);
            await initializeWallet();
            setLoading(false);
        }
        return;
    };

    return (
        <nav className="navbar">
            <div className="nav-links">
                <a href="/" className="nav-btn">Save files</a>
                <a href="/logs" className="nav-btn">Logs</a>
                <a href="/verify" className="nav-btn">Verify files</a>
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