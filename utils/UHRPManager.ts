import { StorageUploader, StorageDownloader } from '@bsv/sdk';
import type { WalletClient } from '@bsv/sdk';

const UHRP_SERVER = 'https://go-uhrp-eu-1.bsvblockchain.tech';
const RETENTION_MINUTES = 365 * 24 * 60;

export async function uploadToUHRP(encryptedBytes: number[], wallet: WalletClient): Promise<string> {
    const uploader = new StorageUploader({ storageURL: UHRP_SERVER, wallet });
    const result = await uploader.publishFile({
        file: { data: encryptedBytes, type: 'application/octet-stream' },
        retentionPeriod: RETENTION_MINUTES,
    });
    return result.uhrpURL;
}

export async function downloadFromUHRP(uhrpURL: string): Promise<number[]> {
    const downloader = new StorageDownloader({ networkPreset: 'mainnet' });
    const result = await downloader.download(uhrpURL);
    return result.data;
}
