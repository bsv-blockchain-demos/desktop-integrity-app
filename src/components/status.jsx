import React, { useState } from 'react'

function Status({ savedFiles }) {
  const [expandedTxIds, setExpandedTxIds] = useState([]);

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
                          setExpandedTxIds(expandedTxIds.filter(id => id !== index));
                        } else {
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