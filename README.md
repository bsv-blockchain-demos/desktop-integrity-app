# Desktop File Integrity

A blockchain-based file integrity and timestamping application built with React, Electron, and the BSV blockchain. Users can securely store files on the blockchain with encrypted content and cryptographic proof of existence, and later recall and decrypt those files.

## Purpose

- **Timestamp and prove file creation** — store a cryptographic hash of the file on-chain as immutable proof
- **Encrypted file storage** — encrypt the file and store it as transaction metadata, recoverable later
- **File recall** — decrypt and download files using transaction logs or a transaction ID
- **Verify file integrity** — query the BSV overlay network to confirm a file's hash exists on-chain

## Key Features

- Select files via file dialog or drag-and-drop
- Files are encrypted using your BSV wallet before being stored on-chain
- File hash stored in the locking script; encrypted content stored as transaction metadata
- Recall files by browsing saved logs or entering a transaction ID directly
- Verify any file against the blockchain by hash
- Transaction history with log viewer

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, React Router
- **Desktop**: Electron 28
- **Blockchain**: BSV SDK, BSV Overlay Network
- **Styling**: CSS
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18 or higher
- npm
- A BSV wallet — used for encryption and transaction signing. Must be running before the app will connect. Two options:
  - [MetaNet Client](https://projectbabbage.com)
  - [BSV Desktop](https://github.com/bsv-blockchain/bsv-desktop)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd desktop-file-integrity
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Running the App

### Production (recommended)

Builds everything and launches the packaged app for your current OS:

```bash
npm run start
```

### Create a distributable installer

```bash
npm run build:win     # Windows (NSIS installer + portable exe)
npm run build:mac     # macOS (DMG)
npm run build:linux   # Linux (AppImage + deb)
npm run build:all     # All platforms at once
```

Installers are written to the `release/` directory.

### Development

Development requires two terminals running simultaneously:

**Terminal 1** — start the Vite renderer dev server:
```bash
npm run dev
```

**Terminal 2** — compile and launch Electron (connects to the Vite dev server):
```bash
npm run electron
```

## Usage

### Saving a File to the Blockchain

1. Ensure MetaNet Client is running and unlocked
2. Open the app — it will connect to your wallet automatically on startup
3. Select a file using the file picker or drag-and-drop
4. Click **Save to blockchain**
5. The file is encrypted, its hash is stored on-chain, and a local log is saved

### Recalling a File

1. Navigate to **Recall Files**
2. Choose a recovery method:
   - **From Logs** — select a previously saved log entry
   - **From Transaction ID** — paste a transaction ID directly
3. The app fetches the transaction, decrypts the content, and offers a download

### Verifying a File

1. Navigate to **Verify**
2. Select or drop the file you want to verify
3. Click **Verify** — the app hashes the file and queries the overlay network

### Viewing Logs

Navigate to **Logs** to browse all saved transaction records.

## Project Structure

```
desktop-file-integrity/
├── src/
│   ├── components/       # React components (homepage, recall, verify, logs, status, sidebar, topbar)
│   └── css/              # Styling files
├── context/              # React context providers (wallet, file)
├── hooks/                # Blockchain logic (transactions.ts, FileHash.ts)
├── utils/                # Queue handler
├── types/                # Shared TypeScript types
├── scripts/              # Build helper scripts
├── electron/             # Electron main process (main.ts, preload.ts)
└── public/               # Static assets
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run start` | Full production build + launch for current OS |
| `npm run dev` | Start Vite renderer dev server only |
| `npm run electron` | Compile TypeScript and launch Electron (requires `dev` running) |
| `npm run build:electron` | Compile Electron main + preload TypeScript only |
| `npm run build:win/mac/linux` | Build distributable installer for target platform |
| `npm run build:all` | Build installers for all platforms |
| `npm run lint` | Run ESLint |

## Security

- Files are encrypted client-side using your wallet's key derivation before leaving your machine
- A unique encryption key is derived per session
- The encrypted file content is stored as transaction metadata; the file hash is stored in the locking script
- Key-to-transaction mappings are stored locally via the wallet's key-value store

## Blockchain Integration

- **BSV Blockchain** — immutable timestamping via Bitcoin SV
- **Overlay Network** — file hash lookup via the `tm_fileintegrity` topic
- **Transactions** — `OP_FALSE OP_RETURN` outputs carrying the file hash; encrypted content in metadata

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a Pull Request

## License

MIT License — see the LICENSE file for details.
