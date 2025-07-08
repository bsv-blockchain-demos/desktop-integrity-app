import React, { useState } from 'react'
import { useWallet } from '../../context/walletContext.jsx';

function Navbar() {
    const { wallet, initializeWallet } = useWallet();
    const [loading, setLoading] = useState(false);

    const handleConnectWallet = async () => {
        if (!wallet) {
            setLoading(true);
            await initializeWallet();
            setLoading(false);
        }
        return;
    };

  return (
    <div>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/logs">Logs</a></li>
                <li><a href="/status">Status</a></li>
                <button onClick={handleConnectWallet} disabled={loading}>Connect Wallet</button>
            </ul>
        </nav>
    </div>
  )
}

export default Navbar;