import { LookupResolver, TopicBroadcaster, Transaction, Utils, WalletClient } from '@bsv/sdk';
import { FileHash } from './FileHash';
import { getOverlayUrl } from '../config/serviceConfig';
import { toast } from 'react-hot-toast';

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
    broadcastTransaction(response, fileName);

    return response;
}

function broadcastTransaction(response: CreateActionResult, fileName: string): void {
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
    submitWithRetry(tx, tb, fileName);
}

// Overlay hosts intermittently reject valid transactions; resubmitting the same BEEF is idempotent.
const SUBMIT_RETRY_DELAYS_MS = [2_000, 5_000, 15_000];

async function submitWithRetry(tx: Transaction, tb: TopicBroadcaster, fileName: string): Promise<void> {
    for (let attempt = 0; attempt <= SUBMIT_RETRY_DELAYS_MS.length; attempt++) {
        try {
            const r = await tx.broadcast(tb);
            console.log("Overlay response:", r);
            if (r.status === 'success') return;
        } catch (e) {
            console.error("Error broadcasting to overlay:", e);
        }
        if (attempt < SUBMIT_RETRY_DELAYS_MS.length) {
            await new Promise(resolve => setTimeout(resolve, SUBMIT_RETRY_DELAYS_MS[attempt]));
        }
    }
    console.error(`Overlay submission failed after ${SUBMIT_RETRY_DELAYS_MS.length + 1} attempts`);
    toast.error(`${fileName} saved on-chain, but the overlay rejected it. \nIt may not show up in Verify.`, {
        duration: 5000,
        position: 'top-center',
        id: `overlay-error-${fileName}`,
    });
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
