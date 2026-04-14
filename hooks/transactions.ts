import { LookupResolver, Utils, WalletClient } from '@bsv/sdk';
import { FileHash } from './FileHash';

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

const overlay = new LookupResolver({
    slapTrackers: ['https://overlay-us-1.bsvb.tech'],
    hostOverrides: {
        'ls_desktopintegrity': ['https://overlay-us-1.bsvb.tech']
    }
});

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
        },
    }) as CreateActionResult;

    broadcastTransaction(response);

    return response;
}

async function broadcastTransaction(response: CreateActionResult): Promise<void> {
    try {
        if (!response.tx) {
            console.error("No tx in response, cannot broadcast");
            return;
        }

        const w = new Utils.Writer();
        w.writeVarIntNum(response.tx.length);
        w.write(response.tx);
        const body = new Uint8Array(w.toArray());

        const overlayResponse = await fetch('https://overlay-us-1.bsvb.tech/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'x-topics': JSON.stringify(['tm_desktopintegrity']),
            },
            body,
        });

        const data = await overlayResponse.json();
        console.log("Overlay response:", data);
    } catch (error) {
        console.error("Error broadcasting to overlay:", error);
    }
}

export async function getTransactionByFileHash(hash: number[]): Promise<OverlayQueryResult> {
    const hexHash = Utils.toHex(hash);
    const response = await overlay.query({
        service: 'ls_desktopintegrity',
        query: { fileHash: hexHash }
    }, 10000) as OverlayQueryResult;
    return response;
}
