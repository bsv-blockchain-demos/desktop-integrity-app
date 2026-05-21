import React from 'react';
import { copyToClipboard } from '../../utils/clipboard';
import type { SavedFile } from '../../types/index';

function Status({ savedFiles }: { savedFiles: SavedFile[] }) {
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
                const txOk = !!file.status?.txID && file.status.txID !== 'Failed' && file.status.txID !== 'Creating...';
                const uhrpFailed = file.status?.uhrpURL === 'Failed';
                const rowClass = !txOk ? 'failed' : uhrpFailed ? 'partial' : 'success';

                return (
                  <tr key={index} className={rowClass}>
                    <td
                      className="transaction-id"
                      onClick={() => {
                        if (!txOk) return;
                        copyToClipboard(file.status.txID, 'Transaction ID');
                      }}
                      title={txOk ? 'Click to copy' : undefined}
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
