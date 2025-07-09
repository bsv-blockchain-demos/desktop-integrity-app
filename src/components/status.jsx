import React from 'react'

function Status({ savedFiles }) {
  return (
    <>
      <h1 className="block-header">Status</h1>
      <div className="status-table-container">
        <table className="status-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>File name</th>
              <th>Satoshis</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {savedFiles && savedFiles.length > 0 ? (
              savedFiles.map((file, index) => (
                <tr key={index}>
                  <td className="transaction-id">0x{Math.random().toString(16).slice(2, 42)}</td>
                  <td>{file}</td>
                  <td>101</td>
                  <td>{new Date().toISOString().slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))
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