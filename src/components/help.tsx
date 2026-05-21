import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/layout.css';
import '../css/help.css';

interface SectionProps {
    id: string;
    icon: string;
    title: string;
    children: React.ReactNode;
}

function Section({ id, icon, title, children }: SectionProps) {
    return (
        <div id={id} className="help-section">
            <div className="help-section-header">
                <span className="help-section-icon">{icon}</span>
                <h2 className="help-section-title">{title}</h2>
            </div>
            <div className="help-section-body">
                {children}
            </div>
        </div>
    );
}

function Help() {
    const { hash } = useLocation();

    useEffect(() => {
        if (!hash) return;
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [hash]);

    return (
        <div className="main-container">
            <div className="content-block help-block custom-scrollbar">
                <h1 className="block-header">How This App Works</h1>

                <Section id="what" icon="🔍" title="What does this app do?">
                    <p>
                        This app lets you <strong>prove that a file hasn't been changed</strong> since you saved it —
                        using the BSV blockchain as a permanent, tamper-proof record.
                    </p>
                    <p>
                        Think of it like a notary stamp. Once a document is notarised, there's a permanent record of
                        what it said at that moment. This app does the same thing digitally, except the record is on a
                        public blockchain that anyone can verify — and nobody can alter.
                    </p>
                    <p className="help-note">
                        <strong>Important:</strong> only a cryptographic fingerprint (hash) of your file is ever
                        recorded on-chain. The file itself never leaves your computer and is never uploaded to the
                        blockchain.
                    </p>
                </Section>

                <Section id="blockchain" icon="⛓️" title="What is a blockchain? (beginner-friendly)">
                    <p>
                        A blockchain is a <strong>public ledger</strong> — a chain of records that, once written, cannot
                        be changed or deleted. Thousands of computers around the world hold a copy of the same ledger,
                        so there's no single person or company that controls it.
                    </p>
                    <p>
                        This app uses <strong>BSV</strong>, a high-capacity public blockchain designed for
                        data applications. When you "save" a file here, the app does <em>not</em> upload the file itself.
                        Instead it takes a <strong>fingerprint</strong> of the file (called a hash) and permanently
                        records that fingerprint in a BSV transaction.
                    </p>
                    <p>
                        That fingerprint is like DNA — if even a single character in the file changes later, the
                        fingerprint will be completely different.
                    </p>
                </Section>

                <Section id="save" icon="💾" title="Save Files">
                    <p>When you select a file and click <strong>"Save to blockchain"</strong>:</p>
                    <ol className="help-list">
                        <li>The app computes a <strong>SHA-256 hash</strong> of your file — a short, unique fingerprint.
                            <strong> Only this hash is sent to the blockchain, never the file itself.</strong></li>
                        <li>That hash is embedded in a BSV transaction and broadcast to the network</li>
                        <li>The transaction is picked up by <strong>overlay nodes</strong> — specialised servers that
                            index and store these hashes so they can be queried quickly</li>
                        <li>A <strong>local log file</strong> is saved with the transaction ID, timestamps, and other details</li>
                        <li>If <strong>Recall is enabled</strong>, the file is also encrypted and stored on UHRP (see below)</li>
                    </ol>
                </Section>

                <Section id="verify" icon="✅" title="Verify Files">
                    <p>
                        Drop or select the same file on the <strong>Verify</strong> page. The app re-computes the
                        file's hash and asks the overlay network: <em>"Has this fingerprint ever been registered?"</em>
                    </p>
                    <ul className="help-list">
                        <li><span className="help-badge success">Match</span> — the file is byte-for-byte identical to what was saved. It hasn't been modified.</li>
                        <li><span className="help-badge fail">No match</span> — the file has been changed since it was saved, or it was never saved at all.</li>
                    </ul>
                    <p className="help-note">
                        This verification is <strong>public</strong> — anyone with the original file can verify it,
                        not just you. The hash on-chain is the proof.
                    </p>
                </Section>

                <Section id="recall" icon="🔄" title="Recall Files (UHRP)">
                    <p>
                        If the <strong>Recall toggle</strong> is on, the app does two extra steps when saving:
                    </p>
                    <ol className="help-list">
                        <li>
                            <strong>Encrypts the file</strong> using your wallet key — so only your wallet can decrypt
                            it. Nobody else can read the stored data.
                        </li>
                        <li>
                            <strong>Uploads the encrypted file to UHRP</strong> — a decentralised storage network
                            built on BSV. Files on UHRP are addressed by their cryptographic hash (the UHRP URL),
                            not by a file name.
                        </li>
                    </ol>
                    <p>
                        Later, you can go to the <strong>Recall</strong> page, pick a log entry, and recover the
                        original file — even if you deleted it locally.
                    </p>
                    <p className="help-note">
                        Because only your wallet holds the decryption key, recall is <strong>private to you</strong>.
                        Others can still verify the file hash publicly on the overlay — they just can't download your
                        encrypted copy.
                    </p>
                </Section>

                <Section id="toggle" icon="⚙️" title="The Recall Toggle">
                    <div className="help-toggle-explainer">
                        <div className="help-toggle-option">
                            <span className="help-badge off">Off</span>
                            <div>
                                <strong>Hash-only mode.</strong> Only the file fingerprint is anchored on-chain.
                                Verify works. No file is uploaded anywhere. Faster, cheaper, no external storage dependency.
                            </div>
                        </div>
                        <div className="help-toggle-option">
                            <span className="help-badge on">On</span>
                            <div>
                                <strong>Full hybrid mode.</strong> Fingerprint goes on-chain <em>and</em> the encrypted
                                file is uploaded to UHRP. Both Verify and Recall work.
                            </div>
                        </div>
                    </div>
                    <p className="help-note" style={{ marginTop: '1rem' }}>
                        The setting is remembered between sessions. You can change it at any time — it only affects
                        files saved <em>after</em> the change.
                    </p>
                </Section>

                <Section id="logs" icon="📋" title="Logs">
                    <p>
                        Every time you save a file, a <strong>log entry</strong> is created locally on your computer.
                        It records:
                    </p>
                    <ul className="help-list">
                        <li>The original file name and size</li>
                        <li>The blockchain <strong>transaction ID</strong> (your proof of registration)</li>
                        <li>The <strong>UHRP URL</strong> (if Recall was enabled) — the address of the encrypted file</li>
                        <li>The <strong>encryption key ID</strong> used — needed to decrypt your file later</li>
                        <li>Timestamps: when you saved it, and when the file was originally created/modified</li>
                    </ul>
                    <p className="help-note">
                        Logs are stored locally only — they are not uploaded anywhere. The Recall feature uses them
                        to find and decrypt your files.
                    </p>
                </Section>

                <Section id="wallet" icon="🔑" title="Your Wallet">
                    <p>
                        This app uses a <strong>BSV wallet</strong> to sign and pay for blockchain transactions.
                        The wallet also provides the encryption keys used to protect your files for Recall.
                    </p>
                    <p>
                        Each file is encrypted with a key derived from your wallet identity. This means:
                    </p>
                    <ul className="help-list">
                        <li>Only your wallet can decrypt recalled files</li>
                        <li>If you switch wallets, you won't be able to recall files saved with the old wallet</li>
                        <li>Your wallet's private key never leaves your device</li>
                    </ul>
                </Section>
            </div>
        </div>
    );
}

export default Help;
