import { WalletClient, Utils, Random } from '@bsv/sdk';
import React, { createContext, useContext, useEffect, useState } from 'react';

export async function checkWalletConnection(wallet) {
    const isConnected = await wallet.isAuthenticated();
    if (isConnected) {
        return true;
    }
    return false;
}

const WalletContext = createContext({});
export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }) {
    const [wallet, setWallet] = useState(null);
    const [pubKey, setPubKey] = useState(null);
    const [derivedPubKey, setDerivedPubKey] = useState(null);
    const [keyID, setKeyID] = useState(Utils.toHex(Random(8))); // Only run once

    const initializeWallet = async () => {
        try {
            const wallet = new WalletClient('auto', 'localhost:3000'); // TODO: Replace with Metanet app
            const isConnected = await wallet.isAuthenticated();

            if (isConnected) {
                setWallet(wallet);

                const pubKey = await wallet.getPublicKey({ identityKey: true });
                setPubKey(pubKey);

                const derivedPubKey = await wallet.getPublicKey({
                    protocolID: [0, 'slackthreads'],
                    keyID
                });
                setDerivedPubKey(derivedPubKey);
            } else {
                console.error('Wallet not authenticated');
            }
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
        }
    };

    // Try auto-connect on load
    useEffect(() => {
        initializeWallet();
    }, []);

    return (
        <WalletContext.Provider
            value={{
                wallet,
                pubKey,
                derivedPubKey,
                keyID,
                checkWalletConnection,
                initializeWallet
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}