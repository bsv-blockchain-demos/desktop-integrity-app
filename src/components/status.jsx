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
                  <td className="transaction-id">{file.status.txID}</td>
                  <td>{file.fileName}</td>
                  <td>{file.status.satoshis}</td>
                  <td>{file.status.time}</td>
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