import React, { useEffect } from 'react'

function Status({ savedFiles }) {
  console.log("savedFiles", savedFiles);

  return (
    <div>
        <h1>Status</h1>
        <ul>
          {savedFiles.map((file, index) => (
            <li key={index}>{file}</li>
          ))}
        </ul>
    </div>
  )
}

export default Status;