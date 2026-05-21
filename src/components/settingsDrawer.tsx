import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    DEFAULTS,
    getOverlayUrl,
    getUhrpUrl,
    setOverlayUrl,
    setUhrpUrl,
    resetToDefaults,
} from '../../config/serviceConfig';
import '../css/settingsDrawer.css';

function SettingsDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [overlayUrl, setOverlayUrlState] = useState(getOverlayUrl);
    const [uhrpUrl, setUhrpUrlState] = useState(getUhrpUrl);

    const handleSave = () => {
        setOverlayUrl(overlayUrl);
        setUhrpUrl(uhrpUrl);
        toast.success('Settings saved');
        setIsOpen(false);
    };

    const handleReset = () => {
        resetToDefaults();
        setOverlayUrlState(DEFAULTS.overlayUrl);
        setUhrpUrlState(DEFAULTS.uhrpUrl);
        toast.success('Reset to defaults');
    };

    return (
        <>
            <div
                className={`settings-backdrop${isOpen ? ' visible' : ''}`}
                onClick={() => setIsOpen(false)}
            />
            <div className={`settings-drawer${isOpen ? ' open' : ''}`}>
                <button
                    className="settings-tab"
                    onClick={() => setIsOpen(o => !o)}
                    title="Service settings"
                >
                    {/* Chevron — rotates via CSS when open */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                <div className="settings-drawer-inner custom-scrollbar">
                    <h2>Service Settings</h2>

                    <div className="settings-field">
                        <label>Overlay URL</label>
                        <input
                            type="text"
                            value={overlayUrl}
                            onChange={e => setOverlayUrlState(e.target.value)}
                            spellCheck={false}
                        />
                        <span className="settings-default">Default: {DEFAULTS.overlayUrl}</span>
                    </div>

                    <div className="settings-field">
                        <label>UHRP URL</label>
                        <input
                            type="text"
                            value={uhrpUrl}
                            onChange={e => setUhrpUrlState(e.target.value)}
                            spellCheck={false}
                        />
                        <span className="settings-default">Default: {DEFAULTS.uhrpUrl}</span>
                    </div>

                    <div className="settings-actions">
                        <button className="settings-save-btn" onClick={handleSave}>
                            Save
                        </button>
                        <button className="settings-reset-btn" onClick={handleReset}>
                            Reset to defaults
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SettingsDrawer;
