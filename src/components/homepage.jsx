import React, { useState, useCallback } from 'react'

function Homepage({ handleSaveToBlockchain, files, setFiles, fileContent, setFilePath, setFileContent, handleCancel }) {
  // Let user select files with dialog
  const handleSelectFiles = async () => {
    if (window.electronAPI?.openDialog) {
      const selected = await window.electronAPI.openDialog();
      if (selected && selected.length > 0) {
        console.log("selected", selected);
        setFiles(selected);
      }
    } else {
      console.error("Electron API not available");
    }
  };

  // Let user drag and drop files
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    console.log("droppedFile", droppedFile);
    if (droppedFile && droppedFile.path) {
      setFilePath(droppedFile.path);
      setFiles(droppedFile.path);
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div>
      {files.length === 0 ? (
        <div style={{ padding: '2rem' }}>
          <h1>File/Folder Picker</h1>
          <button onClick={handleSelectFiles}>Select Files/Folders</button>
          <ul>
            {files.map((path, index) => (
              <li key={index}>{path}</li>
            ))}
          </ul>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              padding: '2rem',
              border: '2px dashed #888',
              borderRadius: '10px',
              textAlign: 'center',
              margin: '2rem',
            }}
          >
            <h2>Drag and Drop a File Here</h2>
          </div>
        </div>
      ) : (

        <>
          {files.length !== 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3>Preview:</h3>
              {fileContent.type === 'image' ? (
                <img
                  src={fileContent.content}
                  alt="Preview"
                  style={{ maxWidth: '400px', borderRadius: '10px' }}
                />
              ) : (
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: '#f0f0f0',
                    padding: '1rem',
                    borderRadius: '6px',
                    maxHeight: '300px',
                    overflow: 'auto',
                  }}
                >
                  {fileContent.content}
                </pre>
              )}
            </div>
          )}

          <div>
            <button onClick={handleCancel}>Cancel</button>
            <button onClick={handleSaveToBlockchain}>Save to blockchain</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Homepage;