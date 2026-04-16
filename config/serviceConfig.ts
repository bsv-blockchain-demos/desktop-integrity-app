export const DEFAULTS = {
    overlayUrl: 'https://overlay-us-1.bsvb.tech',
    uhrpUrl: 'https://go-uhrp-eu-1.bsvblockchain.tech',
} as const;

export function getOverlayUrl(): string {
    return localStorage.getItem('overlayUrl') ?? DEFAULTS.overlayUrl;
}

export function getUhrpUrl(): string {
    return localStorage.getItem('uhrpUrl') ?? DEFAULTS.uhrpUrl;
}

export function setOverlayUrl(url: string): void {
    const trimmed = url.trim();
    if (trimmed) localStorage.setItem('overlayUrl', trimmed);
}

export function setUhrpUrl(url: string): void {
    const trimmed = url.trim();
    if (trimmed) localStorage.setItem('uhrpUrl', trimmed);
}

export function resetToDefaults(): void {
    localStorage.removeItem('overlayUrl');
    localStorage.removeItem('uhrpUrl');
}
