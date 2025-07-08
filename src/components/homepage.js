import React, { useState } from 'react'

function Homepage() {
  const [files, setFiles] = useState([]);
  const [fileContent, setFileContent] = useState('');

  const handleSelectFiles = async () => {
    if (window.electronAPI?.openDialog) {
      const selected = await window.electronAPI.openDialog();
      if (selected && selected.length > 0) {
        setFiles(selected);
        const content = await window.electronAPI.readFile(selected[0]);
        setFileContent(content);
      }
    } else {
      console.error("Electron API not available");
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.path) {
      const content = await window.electronAPI.readFile(droppedFile.path);
      setFilePath(droppedFile.path);
      setFileContent(content);
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCancel = () => {
    setFiles([]);
    setFileContent('');
  };

  const handleSaveToBlockchain = () => {
    // TODO: Save to blockchain
  };

  return (
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
      <pre>{fileContent}</pre>
      {files.length > 0 && (
        <div>
          <button onClick={handleCancel}>Cancel</button>
          <button onClick={handleSaveToBlockchain}>Save to blockchain</button>
        </div>
      )}
    </div>
  );
}

export default Homepage;