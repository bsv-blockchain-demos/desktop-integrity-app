import React, { useState, useEffect } from 'react';
import '../css/layout.css';
import LogContentModal from './logContentModal';
import type { LogEntry } from '../../types/index';

function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const logPaths = await window.electronAPI.listLogs();

        const logContents = await Promise.all(
          logPaths.map(async (filePath): Promise<LogEntry> => {
            const file = await window.electronAPI.readFile(filePath);
            const timestampMatch = file.name.match(/-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);

            let isoTimestamp: string | null = null;
            let timestamp: string | null = null;
            if (timestampMatch) {
              isoTimestamp = timestampMatch[1].replace(/(\d{2})-(\d{2})-(\d{2})$/, (_, h, m, s) => `${h}:${m}:${s}`);
              timestamp = isoTimestamp.substring(0, 16).replace('T', ' ');
            }

            return {
              name: file.name,
              content: file.content,
              isoTimestamp,
              timestamp,
              originalName: file.name.split('-').slice(0, -1).join('-'),
            };
          })
        );

        const sortedLogs = logContents.sort((a, b) => {
          const dateA = a.isoTimestamp ? new Date(a.isoTimestamp) : new Date(0);
          const dateB = b.isoTimestamp ? new Date(b.isoTimestamp) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        setLogs(sortedLogs);
      } catch (error) {
        console.error('Error reading log files:', error);
      }
    }

    fetchLogs();
  }, []);

  const handleLogClick = (log: LogEntry) => {
    setSelectedLog(selectedLog === log ? null : log);
  };

  return (
    <div className="main-container">
      <div className="content-block logs-block">
        <h1 className="block-header">Logs</h1>
        <div className="status-table-container custom-scrollbar">
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
                  <td colSpan={3}>No log files found.</td>
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
