import { Transaction, TopicBroadcaster, LookupResolver } from '@bsv/sdk';
import { FileHash } from './FileHash';

const overlay = new LookupResolver({
    slapTrackers: ['https://overlay-us-1.bsvb.tech'],
    additionalHosts: {
        'ls_fileintegrity': ['https://overlay-us-1.bsvb.tech']
    }
});

export async function createTransaction(fileContent, wallet, encryptedFileContent, fileName) {
    try {
        if (!wallet) {
            throw new Error("Wallet not connected");
        }

        // Create new transaction
        const response = await wallet.createAction({
            description: `File Integrity: ${fileName}`,
            outputs: [
                {
                    outputDescription: "File Integrity",
                    lockingScript: new FileHash().lock(fileContent).toHex(),
                    satoshis: 1,
                }
            ]
        });

        //broadcastTransaction(response, encryptedFileContent);

        return response;
    } catch (error) {
        console.error("Error creating file integrity transaction:", error);
    }
}

export async function broadcastTransaction(response, encryptedFileContent) {
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

export async function getTransactionByTxID(txid) {
    try {
        // get transaction from overlay
        const response = await overlay.query({
            service: 'ls_fileintegrity', query: {
                txid: txid
            }
        }, 10000);

        return response;
    } catch (error) {
        console.error("Error getting file integrity transaction:", error);
    }
}