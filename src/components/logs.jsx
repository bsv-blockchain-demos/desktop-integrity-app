import React, { useState, useEffect } from 'react'
import '../css/layout.css';
import LogContentModal from './logContentModal';

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

            let isoTimestamp = null;
            let timestamp = null;
            if (timestampMatch) {
              // Convert to ISO format like "2025-08-03T14:32:10"
              isoTimestamp = timestampMatch[1].replace('T', 'T').replace(/(\d{2})-(\d{2})-(\d{2})$/, (_, h, m, s) => `${h}:${m}:${s}`);
              timestamp = timestampMatch[1].replace('T', ' ').replace(/:/g, ':').substring(0, 16);
            }

            return {
              name: file.name,
              content: file.content,
              isoTimestamp: isoTimestamp,
              timestamp: timestamp,
              // Extract the original filename without the timestamp
              originalName: file.name.split('-').slice(0, -1).join('-')
            };
          })
        );

        // Sort logs by timestamp, newest first
        const sortedLogs = logContents.sort((a, b) => {
          // Convert timestamps to Date objects for comparison
          const dateA = a.isoTimestamp ? new Date(a.isoTimestamp) : new Date(0);
          const dateB = b.isoTimestamp ? new Date(b.isoTimestamp) : new Date(0);
          return dateB - dateA; // Descending order (newest first)
        });

        setLogs(sortedLogs);
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
            <thead className="table-head">
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
                        {selectedLog === log ? 'Hide' : 'View details'}
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
          <LogContentModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </div>
    </div>
  );
}

export default Logs;