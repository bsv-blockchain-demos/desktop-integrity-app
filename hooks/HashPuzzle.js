import { LockingScript, UnlockingScript, OP, Hash } from '@bsv/sdk';

// TODO: Change logic so it's decryptable

export class HashPuzzle {
    lock(EncryptedContent) {
        const fileHash = Hash.sha256(EncryptedContent);

        return new LockingScript([
            { op: OP.OP_SHA256 },
            { op: fileHash.length, data: fileHash },
            { op: OP.OP_EQUAL }
        ])
    }
    unlock(EncryptedContent) {
        const fileHash = EncryptedContent;
        
        return new UnlockingScript([
            { op: fileHash.length, data: fileHash }
        ])
    }
}