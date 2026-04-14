import React from 'react';
import { toast } from 'react-hot-toast';
import type { SavedFile } from '../../types/index';

function Status({ savedFiles }: { savedFiles: SavedFile[] }) {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <>
      <h1 className="block-header">Status</h1>
      <div className="status-table-container custom-scrollbar">
        <table className="status-table">
          <thead className="table-head">
            <tr>
              <th>Transaction ID</th>
              <th>File name</th>
              <th>UHRP URL</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {savedFiles && savedFiles.length > 0 ? (
              savedFiles.map((file, index) => {
                const isSuccess = file.status?.txID && file.status.txID !== 'Failed';

                return (
                  <tr key={index} className={isSuccess ? 'success' : 'failed'}>
                    <td
                      className="transaction-id"
                      onClick={() => {
                        if (!isSuccess) return;
                        copyToClipboard(file.status.txID, 'Transaction ID');
                      }}
                      title={isSuccess ? 'Click to copy' : undefined}
                    >
                      {file.status?.txID
                        ? `${file.status.txID.substring(0, 12)}...`
                        : 'Failed'}
                    </td>
                    <td>{file.fileName}</td>
                    <td
                      className="transaction-id"
                      onClick={() => {
                        const url = file.status?.uhrpURL;
                        if (!url || url === 'Uploading...' || url === 'Failed') return;
                        copyToClipboard(url, 'UHRP URL');
                      }}
                      title={
                        file.status?.uhrpURL && file.status.uhrpURL !== 'Uploading...' && file.status.uhrpURL !== 'Failed'
                          ? 'Click to copy'
                          : undefined
                      }
                    >
                      {file.status?.uhrpURL
                        ? file.status.uhrpURL === 'Uploading...' || file.status.uhrpURL === 'Failed'
                          ? file.status.uhrpURL
                          : `${file.status.uhrpURL.substring(0, 16)}...`
                        : '–'}
                    </td>
                    <td>{file.status?.time ?? 'N/A'}</td>
                  </tr>
                );
              })
            ) : (
              <tr className="empty-row">
                <td colSpan={4}>No files have been saved yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Status;
