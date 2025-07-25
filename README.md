# Desktop File Integrity

A blockchain-based file integrity and timestamping application built with React, Electron, and the BSV blockchain. This application allows users to securely upload files to the blockchain for proof of creation and timestamping, while maintaining the ability to recover files through encrypted storage.

## 🎯 Purpose

This application helps users:
- **Timestamp and prove file creation** - Store cryptographic proof of file existence on the blockchain
- **Secure file storage** - Encrypt files using Metanet desktop functions with unique encryption keys
- **File recovery** - Decrypt and recall files if ever lost using key-value store records
- **Verify file integrity** - Query the BSV overlay network to verify file existence

## ✨ Key Features

### File Upload & Blockchain Storage
- Select files via file dialog or drag-and-drop interface
- Generate cryptographic hashes of files
- Store file hashes on the BSV blockchain in unspendable transactions
- Real-time status tracking of blockchain transactions

### File Encryption & Security
- Files are encrypted using Metanet desktop encryption functions
- Unique encryption keys derived for each login session
- Only file hashes (not actual file content) are stored on the blockchain
- Secure key management through local key-value store

### File Recovery & Verification
- Recall encrypted files using transaction IDs
- Decrypt files using stored encryption keys
- Query BSV overlay network to verify file existence
- Browse transaction logs for file history

### User Interface
- Modern, responsive React-based interface
- Side-by-side layout with file picker and status display
- Transaction history with expandable transaction IDs
- Real-time notifications and status updates

## 🛠 Technology Stack

- **Frontend**: React 19, Vite, React Router
- **Desktop**: Electron 28
- **Blockchain**: BSV SDK, BSV Overlay Network
- **Styling**: CSS with modern layout patterns
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- BSV wallet for blockchain transactions

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd desktop-file-integrity
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with your configuration:
   ```env
   # Add your environment variables here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Run as Electron app**
   ```bash
   npm run electron
   ```

## 📖 Usage

### Uploading Files to Blockchain

1. **Connect your BSV wallet** using the "Connect Wallet" button
2. **Select files** either by:
   - Clicking "Select Files/Folders" button
   - Dragging and dropping files into the interface
3. **Review selected files** in the file picker section
4. **Save to blockchain** - files will be encrypted and their hashes stored on-chain
5. **Monitor status** in the status table showing transaction IDs and timestamps

### Recovering Files

1. **Navigate to the Recall section**
2. **Choose recovery method**:
   - **From Transaction ID**: Enter a specific transaction ID
   - **From Logs**: Select from previously saved transaction logs
3. **Decrypt and download** the recovered file

### Viewing Transaction History

1. **Check the Logs section** for complete transaction history
2. **Click on transaction IDs** to view detailed information
3. **Export logs** for backup purposes

## 🏗 Project Structure

```
desktop-file-integrity/
├── src/
│   ├── components/          # React components
│   │   ├── homepage.jsx     # Main file upload interface
│   │   ├── recall.jsx       # File recovery interface
│   │   ├── status.jsx       # Transaction status display
│   │   ├── logs.jsx         # Transaction history
│   │   └── navbar.jsx       # Navigation component
│   ├── context/             # React context providers
│   └── css/                 # Styling files
├── hooks/
│   ├── transactions.js      # Blockchain transaction logic
│   └── FileHash.js          # File hashing utilities
├── electron/                # Electron main process
├── LOGS/                    # Transaction log storage
└── public/                  # Static assets
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run electron` - Run Electron app
- `npm run lint` - Run ESLint

## 🔐 Security Features

- **Client-side encryption** using Metanet encryption functions
- **Unique key derivation** for each login session
- **Blockchain immutability** for timestamp verification
- **Local key storage** with secure key-value store
- **Hash-only blockchain storage** (actual files never stored on-chain)

## 🌐 Blockchain Integration

- **BSV Blockchain**: Uses Bitcoin SV for immutable timestamping
- **Overlay Network**: Queries BSV overlay for file verification
- **Unspendable Transactions**: File hashes stored in unspendable outputs
- **Topic Broadcasting**: Broadcasts to 'tm_fileintegrity' topic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the transaction logs in the LOGS directory
2. Verify your BSV wallet connection
3. Ensure proper network connectivity to BSV overlay services
4. Review the browser console for detailed error messages

## 🔮 Future Enhancements

- Batch file processing
- Advanced file filtering and search
- Integration with additional blockchain networks
- Enhanced encryption options
- Mobile application support
