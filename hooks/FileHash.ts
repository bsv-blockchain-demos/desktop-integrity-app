import { LockingScript, OP, Hash } from '@bsv/sdk';

// Creates an OP_FALSE OP_RETURN locking script containing the SHA-256 hash of the file bytes
export class FileHash {
    lock(bytes: number[]): LockingScript {
        const fileHash = Hash.sha256(bytes);

        return new LockingScript([
            { op: OP.OP_FALSE },
            { op: OP.OP_RETURN },
            { op: fileHash.length, data: fileHash },
        ]);
    }
}
