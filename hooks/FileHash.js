import { LockingScript, OP, Hash, Utils } from '@bsv/sdk';

// Create filehash to put on blockchain
// OP_FALSE, OP_RETURN to create unspendable tx output

export class FileHash {
    lock(fileContent) {
        const fileHash = Hash.sha256(Utils.toArray(fileContent), 'utf-8');

        return new LockingScript([
            { op: OP.OP_FALSE },
            { op: OP.OP_RETURN },
            { op: fileHash.length, data: fileHash },
        ])
    }
}