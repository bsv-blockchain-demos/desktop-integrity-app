import { Transaction, TopicBroadcaster, LookupResolver, Utils } from '@bsv/sdk';
import { FileHash } from './FileHash';

const overlay = new LookupResolver({
    slapTrackers: ['https://overlay-us-1.bsvb.tech'],
    hostOverrides: {
        'ls_desktopintegrity': ['https://overlay-us-1.bsvb.tech']
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

        broadcastTransaction(response, encryptedFileContent);

        return response;
    } catch (error) {
        console.error("Error creating file integrity transaction:", error);
    }
}

export async function broadcastTransaction(response, encryptedFileContent) {
    try {
        // broadcast transaction to overlay
        // Capture the resulting transaction
        // const tx = Transaction.fromBEEF(response.tx);
        // const metadata = new Map().set('OffChainValues', encryptedFileContent);
        // tx.metadata = metadata; 

        // Writing, beef.length, beef, offchainvalues

        // Lookup a service which accepts this type of token
         //const tb = new TopicBroadcaster(['tm_desktopintegrity'], {
        //     resolver: overlay,
        //     requireAcknowledgmentFromSpecificHostsForTopics: {
        //       'ls_desktopintegrity': ['https://overlay-us-1.bsvb.tech']
        //     }
        //   })

        // Send the tx to that overlay.
        //const overlayResponse = await tx.broadcast(tb)
        //console.log("Overlay response: ", overlayResponse);

        console.log("Broadcasting transaction to overlay");

        const headers = {
            'x-includes-off-chain-values': 'true',
            'Content-Type': 'application/octet-stream',
            'x-topics': JSON.stringify(['tm_desktopintegrity'])
        }
        let taggedBEEF = {
            beef: response.tx,
            offChainValues: encryptedFileContent
        }

        const w = new Utils.Writer()
        w.writeVarIntNum(taggedBEEF.beef.length)
        w.write(taggedBEEF.beef)
        w.write(taggedBEEF.offChainValues)
        const body = new Uint8Array(w.toArray())

        const overlayResponse = await fetch('https://overlay-us-1.bsvb.tech/submit', {
            method: 'POST',
            headers,
            body,
        });
        
        const data = await overlayResponse.json();
        console.log("Overlay response: ", data);
    } catch (error) {
        console.error("Error broadcasting file integrity tx:", error);
    }
}

export async function getTransactionByFileHash(hash) {
    try {
        // get transaction from overlay
        const response = await overlay.query({
            service: 'ls_desktopintegrity', query: {
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
            service: 'ls_desktopintegrity', query: {
                txid: txid
            }
        }, 10000);

        return response;
    } catch (error) {
        console.error("Error getting file integrity transaction:", error);
    }
}