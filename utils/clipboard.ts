import { toast } from 'react-hot-toast';

export async function copyToClipboard(text: string, label: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        toast.error('Failed to copy to clipboard');
    }
}
