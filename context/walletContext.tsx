import { WalletClient, Utils, Random, LocalKVStore } from '@bsv/sdk';
import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import useClearLocalStorageOnQuit from '../hooks/clearStorage';
import { toast } from 'react-hot-toast';

interface WalletContextType {
    wallet: WalletClient | null;
    pubKey: string | null;
    derivedPubKey: string | null;
    keyID: string;
    localKVStore: LocalKVStore;
    checkWalletConnection: (wallet: WalletClient) => Promise<boolean>;
    initializeWallet: () => Promise<void>;
}

export async function checkWalletConnection(wallet: WalletClient): Promise<boolean> {
    const result = await wallet.isAuthenticated();
    return !!result;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);
export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [wallet, setWallet] = useState<WalletClient | null>(null);
    const [pubKey, setPubKey] = useState<string | null>(null);
    const [derivedPubKey, setDerivedPubKey] = useState<string | null>(null);

    // KeyID is static per session
    const keyIDRef = useRef<string | null>(null);
    if (!keyIDRef.current) {
        const existing = localStorage.getItem('keyID');
        if (existing) {
            keyIDRef.current = existing;
        } else {
            const newKey = Utils.toHex(Random(8));
            localStorage.setItem('keyID', newKey);
            keyIDRef.current = newKey;
        }
    }
    const keyID = keyIDRef.current as string;
    const localKVStore = new LocalKVStore();
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

            setWallet(newWallet);
            setPubKey(identityKey.publicKey);
            setDerivedPubKey(derivedKey.publicKey);
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
    }, [keyID]);

    return (
        <WalletContext.Provider
            value={{
                wallet,
                pubKey,
                derivedPubKey,
                keyID,
                localKVStore,
                checkWalletConnection,
                initializeWallet,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}
