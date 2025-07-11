import { WalletClient, Transaction, TopicBroadcaster, LookupResolver } from '@bsv/sdk';
import { HashPuzzle } from './HashPuzzle';
import dotenv from 'dotenv';
dotenv.config();

const overlay = new LookupResolver({
    slapTrackers: ['https://overlay-us-1.bsvb.tech'],
    additionalHosts: {
        'ls_fileintegrity': ['https://overlay-us-1.bsvb.tech']
    }
});

export async function createTransaction(encryptedFileContent) {
    try {
        const wallet = new WalletClient("auto", process.env.FILE_INTEGRITY_WORKSPACE);

        // Create new transaction
        const response = await wallet.createAction({
            description: "File Integrity",
            outputs: [
                {
                    outputDescription: "File Integrity",
                    lockingScript: new HashPuzzle().lock(encryptedFileContent),
                    satoshis: 1,
                }
            ]
        });

        broadcastTransaction(response);

        return response;
    } catch (error) {
        console.error("Error creating file integrity transaction:", error);
    }
}

export async function broadcastTransaction(response) {
    try {
        // broadcast transaction to overlay
        // Capture the resulting transaction
        const tx = Transaction.fromBEEF(response.tx);

        // Lookup a service which accepts this type of token
        const tb = new TopicBroadcaster(['tm_fileintegrity'], {
            resolver: overlay,
            requireAcknowledgmentFromSpecificHostsForTopics: {
              'ls_fileintegrity': ['https://overlay-us-1.bsvb.tech']
            }
          })

        // Send the tx to that overlay.
        const overlayResponse = await tx.broadcast(tb)
        console.log("Overlay response: ", overlayResponse);
    } catch (error) {
        console.error("Error broadcasting file integrity tx:", error);
    }
}

export async function getTransactionByFileHash(hash) {
    try {
        // get transaction from overlay
        const response = await overlay.query({
            service: 'ls_fileintegrity', query: {
                fileHash: hash
            }
        }, 10000);

        return response;
    } catch (error) {
        console.error("Error getting file integrity transaction:", error);
    }
}