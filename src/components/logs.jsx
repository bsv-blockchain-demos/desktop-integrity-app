import React, { useState, useEffect } from 'react'
import '../css/layout.css';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const logPaths = await window.electronAPI.listLogs();

        const logContents = await Promise.all(
          logPaths.map(async (filePath) => {
            const file = await window.electronAPI.readFile(filePath);
            // Extract timestamp from filename (assuming format like filename-YYYY-MM-DDThh-mm-ss.txt)
            const timestampMatch = file.name.match(/-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
            const timestamp = timestampMatch ? 
              timestampMatch[1].replace('T', ' ').replace(/-/g, ':').substring(0, 16) : 
              'Unknown';
              
            return {
              name: file.name,
              content: file.content,
              timestamp: timestamp,
              // Extract the original filename without the timestamp
              originalName: file.name.split('-').slice(0, -1).join('-')
            };
          })
        );

        setLogs(logContents);
      } catch (error) {
        console.error('Error reading log files:', error);
      }
    }

    fetchLogs();
  }, []); // Only run once on mount

  const handleLogClick = (log) => {
    setSelectedLog(selectedLog === log ? null : log);
  };

  return (
    <div className="main-container">
      <div className="content-block logs-block">
        <h1 className="block-header">Logs</h1>
        <div className="status-table-container">
          <table className="status-table logs-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <tr key={index} className={selectedLog === log ? 'selected-row' : ''}>
                    <td>{log.originalName}</td>
                    <td>{log.timestamp}</td>
                    <td>
                      <button 
                        className="action-button small-button"
                        onClick={() => handleLogClick(log)}
                      >
                        {selectedLog === log ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan="3">No log files found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedLog && (
          <div className="log-content">
            <h3>Log Content</h3>
            <pre className="log-pre">{selectedLog.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default Logs;