import { StorageUploader, StorageDownloader } from '@bsv/sdk';
import type { WalletClient } from '@bsv/sdk';
import { getUhrpUrl } from '../config/serviceConfig';

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

export async function downloadFromUHRP(uhrpURL: string): Promise<number[]> {
    const downloader = new StorageDownloader({ networkPreset: 'mainnet' });
    const result = await downloader.download(uhrpURL);
    return result.data;
}
