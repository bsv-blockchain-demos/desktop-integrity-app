# Desktop File Integrity

An Electron application for recording file hashes on BSV, finding matching records through an overlay service and optionally retrieving encrypted file copies from UHRP storage. The interface uses React, TypeScript and Vite.

The blockchain transaction contains the file's SHA-256 hash. When **Enable Recall (UHRP)** is selected, the app separately encrypts and uploads the file to a storage service. A matching hash records the submitted bytes; it does not prove authorship or the file's original creation time.

## Main workflows

| Workflow | Current behaviour |
| --- | --- |
| Save | Read a file up to 25 MiB, create a one-satoshi hash output and submit the transaction to the `tm_desktopintegrity` overlay topic. |
| Enable recall | Encrypt the file through the connected wallet and request 30 days of UHRP storage. This option is enabled by default. |
| Verify | Hash a selected file and query `ls_desktopintegrity` for matching transactions. |
| Recall | Download an encrypted copy using a saved log or UHRP URL, then decrypt it through the original wallet. |
| Logs | Keep local records of the filename, transaction ID, key identifier, file metadata and any UHRP URL. |

Hash publication and storage upload are separate steps and can succeed or fail independently. Overlay submission runs asynchronously after transaction creation; a transaction ID alone does not establish that overlay lookup or recall will work.

## Prerequisites

- Node.js 22.12 or newer and npm.
- A desktop environment supported by Electron.
- A running, unlocked BRC-100 wallet with funds for transactions and any storage charges.
- Access to the configured overlay and, for recall, a UHRP storage service.

## Local development

```sh
git clone https://github.com/bsv-blockchain-demos/desktop-integrity-app.git
cd desktop-integrity-app
npm ci
```

Start the renderer in one terminal:

```sh
npm run dev
```

Compile and launch Electron in another terminal:

```sh
npm run electron
```

Electron loads `http://localhost:5173` in development. Keep that port available; if Vite selects a different port, Electron will still request 5173. Opening the Vite page in a regular browser is insufficient for file dialogs and local logs, which use Electron's preload API.

The wallet client uses the application origin `localhost:3000`. This is the origin passed to the wallet, not the Vite server port.

## Configuration

Use the settings drawer to change service URLs. Defaults are defined in [config/serviceConfig.ts](config/serviceConfig.ts):

| Service | Default |
| --- | --- |
| Overlay | `https://overlay-us-1.bsvb.tech` |
| UHRP storage | `https://go-uhrp-us-1.bsvblockchain.tech` |

There is no `.env` configuration path for these settings. They are stored in browser `localStorage`, which the app clears on its normal quit flow. Custom service URLs therefore need to be set again after restarting.

## Try the file journey

1. Open and unlock the wallet, then launch the application.
2. Select a small, non-sensitive file. Choose whether an encrypted retrievable copy is needed.
3. Select **Save to blockchain** and review both the transaction and storage outcomes.
4. Use **Verify** with the same file to look for a matching overlay record.
5. If the storage upload succeeded, open **Recall Files**, select its log or enter its UHRP URL, and save the decrypted result.

Recall requires the original wallet's cryptographic identity and the key identifier from the log or wallet-backed key-value mapping. A transaction ID by itself is not the current recall interface. UHRP availability depends on hosts and the requested retention period, so keep an independent copy of important files.

Development logs are written to `LOGS/`; packaged applications use the `logs` directory inside Electron's application data directory. File creation and modification times in these logs come from the local filesystem. The renderer also logs selected file content during development, so use non-sensitive demonstration files.

## Build and package

| Command | Purpose |
| --- | --- |
| `npm run build:electron` | Compile the Electron main and preload processes. |
| `npm start` | Compile, build the renderer, create an unpacked application and launch it. |
| `npm run build` | Build installers for the current platform. |
| `npm run build:win` | Request Windows NSIS and portable targets. |
| `npm run build:mac` | Request a macOS DMG. |
| `npm run build:linux` | Request Linux AppImage and Debian targets. |
| `npm run build:all` | Request all configured platform targets. |
| `npm run lint` | Run ESLint. |

Packaging output goes to `release/`. Platform-specific toolchains and signing requirements still apply. The configuration references icons under `build/`, but those files are absent from this checkout. Compilation and renderer builds do not verify installer creation or the desktop wallet journey.

## Code map

- [context/fileContext.tsx](context/fileContext.tsx): file publication, optional upload and log creation.
- [hooks/transactions.ts](hooks/transactions.ts): hash transactions and overlay lookup.
- [utils/UHRPManager.ts](utils/UHRPManager.ts): encrypted upload, host resolution and download integrity checks.
- [electron/main.ts](electron/main.ts): desktop window, file access and persistent logs.

## Licence

**Open BSV Licence v6.** See [LICENSE.md](LICENSE.md) for the full terms.
