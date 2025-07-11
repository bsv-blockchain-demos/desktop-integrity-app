import { WalletClient, Utils, Random } from '@bsv/sdk';
import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import useClearLocalStorageOnQuit from '../hooks/clearStorage';
import { toast } from 'react-hot-toast';

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
    // KeyID is static per session
    const keyIDRef = useRef(null);
    if (!keyIDRef.current) {
        const existing = localStorage.getItem('keyID');
        if (existing) keyIDRef.current = existing;
        else {
            const newKey = Utils.toHex(Random(8));
            localStorage.setItem('keyID', newKey);
            keyIDRef.current = newKey;
        }
    }
    const keyID = keyIDRef.current;
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
                protocolID: [0, 'fileintegrity'],
                keyID,
            });

            // Only update state once everything is fetched
            setWallet(newWallet);
            setPubKey(identityKey);
            setDerivedPubKey(derivedKey);
            toast.success('Wallet connected successfully', {
                duration: 5000,
                position: 'top-center',
                id: 'wallet-connect-success',
            });
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
            toast.error('Failed to connect wallet. \nTo save files to blockchain, please open a wallet client.', {
                duration: 5000,
                position: 'top-center',
                id: 'wallet-connect-error',
            });
        }
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