import { LookupResolver, TopicBroadcaster, Transaction, Utils, WalletClient } from '@bsv/sdk';
import { FileHash } from './FileHash';
import { getOverlayUrl } from '../config/serviceConfig';

interface OverlayOutput {
    beef: number[];
    outputIndex: number;
    [key: string]: unknown;
}

interface OverlayQueryResult {
    outputs: OverlayOutput[];
}

interface CreateActionResult {
    txid?: string;
    tx?: number[];
}

export async function createTransaction(
    bytes: number[],
    wallet: WalletClient,
    fileName: string
): Promise<CreateActionResult> {
    if (!wallet) throw new Error("Wallet not connected");

    const response = await wallet.createAction({
        description: `File Integrity: ${fileName}`,
        outputs: [
            {
                outputDescription: "File Integrity",
                lockingScript: new FileHash().lock(bytes).toHex(),
                satoshis: 1,
            }
        ],
        options: {
            randomizeOutputs: false,
            acceptDelayedBroadcast: false,
        },
    }) as CreateActionResult;

    console.log("Transaction created:", { txid: response.txid, hasTx: !!response.tx });
    broadcastTransaction(response);

    return response;
}

function broadcastTransaction(response: CreateActionResult): void {
    if (!response.tx) {
        console.error("No tx in response, cannot broadcast");
        return;
    }
    const overlayUrl = getOverlayUrl();
    const overlay = new LookupResolver({
        slapTrackers: [overlayUrl],
        hostOverrides: {
            'ls_ship': [overlayUrl],
            'ls_desktopintegrity': [overlayUrl],
        }
    });
    const tb = new TopicBroadcaster(['tm_desktopintegrity'], { resolver: overlay });
    const tx = Transaction.fromBEEF(response.tx);
    console.log("Broadcasting transaction:", tx);
    tx.broadcast(tb)
        .then(r => console.log("Overlay response:", r))
        .catch(e => console.error("Error broadcasting to overlay:", e));
}

export async function getTransactionByFileHash(hash: number[]): Promise<OverlayQueryResult> {
    const overlayUrl = getOverlayUrl();
    const overlay = new LookupResolver({
        slapTrackers: [overlayUrl],
        hostOverrides: {
            'ls_ship': [overlayUrl],
            'ls_desktopintegrity': [overlayUrl],
        }
    });
    const hexHash = Utils.toHex(hash);
    const response = await overlay.query({
        service: 'ls_desktopintegrity',
        query: { fileHash: hexHash }
    }, 10000) as OverlayQueryResult;
    return response;
}
