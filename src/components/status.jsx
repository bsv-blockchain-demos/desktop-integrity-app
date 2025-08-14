import React, { useState } from 'react'
import { toast } from 'react-hot-toast';

function Status({ savedFiles }) {
  const [expandedTxIds, setExpandedTxIds] = useState([]);

  const copyToClipboard = async (txId) => {
    try {
      await navigator.clipboard.writeText(txId);
      toast.success('Transaction ID copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <>
      <h1 className="block-header">Status</h1>
      <div className="status-table-container">
        <table className="status-table">
          <thead className="table-head">
            <tr>
              <th>Transaction ID</th>
              <th>File name</th>
              <th>Satoshis</th>
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
                      className={`transaction-id ${expandedTxIds.includes(index) ? 'show-full' : ''}`}
                      onClick={() => {
                        if (!isSuccess) return; // Only allow clicking on successful transactions
                        
                        if (expandedTxIds.includes(index)) {
                          // If already expanded, copy to clipboard
                          copyToClipboard(file.status.txID);
                          setExpandedTxIds(expandedTxIds.filter(id => id !== index));
                        } else {
                          // If collapsed, expand it
                          setExpandedTxIds([...expandedTxIds, index]);
                        }
                      }}
                    >
                      {file.status?.txID || 'Failed'}
                    </td>
                    <td>{file.fileName}</td>
                    <td>{file.status?.satoshis || 'Failed'}</td>
                    <td>{file.status?.time || 'N/A'}</td>
                  </tr>
                );
              })
            ) : (
              <tr className="empty-row">
                <td colSpan="4">No files have been saved yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Status;