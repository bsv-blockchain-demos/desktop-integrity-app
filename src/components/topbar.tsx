import React from 'react'
import '../css/topbar.css';

function TopBar() {
    return (
        <div className="draggable">
            <div className="app-title">🗂 File Integrity</div>
            <div className="no-drag">
                <button onClick={() => window.electronAPI.minimize()}>—</button>
                <button onClick={() => window.electronAPI.toggleMaximize()}>⬜</button>
                <button onClick={() => window.electronAPI.close()}>✕</button>
            </div>
        </div>
    );
}

export default TopBar;