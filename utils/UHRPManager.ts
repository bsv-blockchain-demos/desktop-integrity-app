import { StorageUploader, LookupResolver, Transaction, PushDrop, Utils, Hash, StorageUtils } from '@bsv/sdk';
import type { WalletClient } from '@bsv/sdk';
import { getOverlayUrl, getUhrpUrl } from '../config/serviceConfig';

const RETENTION_MINUTES = 30 * 24 * 60; // 30 days

export async function uploadToUHRP(encryptedBytes: number[], wallet: WalletClient): Promise<string> {
    const uhrpUrl = getUhrpUrl();
    console.log("Uploading to UHRP:", uhrpUrl);
    const uploader = new StorageUploader({ storageURL: uhrpUrl, wallet });
    const result = await uploader.publishFile({
        file: { data: encryptedBytes, type: 'application/octet-stream' },
        retentionPeriod: RETENTION_MINUTES,
    });
    console.log("UHRP upload complete:", result.uhrpURL);
    return result.uhrpURL;
}

const RESOLVE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;

async function resolveHosts(uhrpURL: string): Promise<string[]> {
    const overlayUrl = getOverlayUrl();
    const resolver = new LookupResolver({
        slapTrackers: [overlayUrl],
        hostOverrides: {
            'ls_ship': [overlayUrl],
            'ls_uhrp': [overlayUrl],
        },
    });
    const response = await resolver.query(
        { service: 'ls_uhrp', query: { uhrpUrl: uhrpURL } },
        RESOLVE_TIMEOUT_MS,
    );
    if (response.type !== 'output-list') throw new Error('Lookup answer must be an output list');

    const now = Math.floor(Date.now() / 1000);
    const hosts: string[] = [];
    for (const output of response.outputs) {
        const tx = Transaction.fromBEEF(output.beef);
        const { fields } = PushDrop.decode(tx.outputs[output.outputIndex].lockingScript);
        const expiry = new Utils.Reader(fields[3]).readVarIntNum();
        if (expiry < now) continue;
        hosts.push(Utils.toUTF8(fields[2]));
    }
    return hosts;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
        return await fetch(url, { method: 'GET', signal: ctrl.signal });
    } finally {
        clearTimeout(timer);
    }
}

export async function downloadFromUHRP(uhrpURL: string): Promise<number[]> {
    console.log("Downloading from UHRP:", uhrpURL);
    if (!StorageUtils.isValidURL(uhrpURL)) throw new Error('Invalid UHRP URL');

    let hosts: string[];
    try {
        hosts = await resolveHosts(uhrpURL);
        console.log("UHRP resolve returned hosts:", hosts);
    } catch (e) {
        console.error("UHRP resolve failed:", e);
        throw new Error(`UHRP resolve failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (!hosts.length) throw new Error('No one currently hosts this file');

    const expectedHash = StorageUtils.getHashFromURL(uhrpURL);
    const errors: string[] = [];
    for (const host of hosts) {
        console.log("UHRP fetching from host:", host);
        try {
            const res = await fetchWithTimeout(host, FETCH_TIMEOUT_MS);
            if (!res.ok) { errors.push(`${host} -> HTTP ${res.status}`); continue; }
            const content = [...new Uint8Array(await res.arrayBuffer())];
            const contentHash = Hash.sha256(content);
            if (contentHash.some((b, i) => b !== expectedHash[i])) {
                errors.push(`${host} -> hash mismatch`);
                continue;
            }
            console.log("UHRP download complete, bytes:", content.length);
            return content;
        } catch (e) {
            errors.push(`${host} -> ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    throw new Error(`Unable to download from any host. ${errors.join('; ')}`);
}
