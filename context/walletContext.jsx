import { WalletClient, Utils, Random } from '@bsv/sdk';
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import useClearLocalStorageOnQuit from '../hooks/clearStorage';

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
    const [keyID, setKeyID] = useState(() => {
        const existing = localStorage.getItem('keyID');
        if (existing) return existing;
        const newKey = Utils.toHex(Random(8));
        localStorage.setItem('keyID', newKey);
        return newKey;
    });
    console.log("keyID", keyID);

    useClearLocalStorageOnQuit();

    const initializeWallet = useCallback(async () => {
        try {
            const newWallet = new WalletClient('auto', 'localhost:3000');

            const isConnected = await newWallet.isAuthenticated();
            if (!isConnected) {
                console.error('Wallet not authenticated');
                return;
            }

            const identityKey = await newWallet.getPublicKey({ identityKey: true });
            const derivedKey = await newWallet.getPublicKey({
                protocolID: [0, 'slackthreads'],
                keyID,
            });

            // Only update state once everything is fetched
            setWallet(newWallet);
            setPubKey(identityKey);
            setDerivedPubKey(derivedKey);
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
        }
    }, [keyID]);

    // Run once on mount
    useEffect(() => {
        initializeWallet();
    }, [initializeWallet]);

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