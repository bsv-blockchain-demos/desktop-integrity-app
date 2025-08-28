import React, { useCallback, useEffect } from 'react'
import { useFile } from '../../context/fileContext.jsx';
import Status from './status';
import '../css/layout.css';
import globalQueue from '../../utils/queueHandler';
import { toast } from 'react-hot-toast';

function Homepage() {
  const { files, setFiles, fileContent, setFilePath, handleCancel, savedFiles, handleSaveToBlockchain } = useFile();
  // Let user select files with dialog
  const handleSelectFiles = async () => {
    if (window.electronAPI?.openDialog) {
      const selected = await window.electronAPI.openDialog();
      if (selected && selected.length > 0) {
        console.log("selected", selected);
        setFiles(selected);
        setFilePath(selected);
      }
    } else {
      console.error("Electron API not available");
    }
  };

  useEffect(() => {
    const clearFileState = () => {
      setFiles([]);
      setFilePath('');
    }
    clearFileState();
  }, []);

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

  const handleSaveClick = () => {
    globalQueue.enqueue(async () => {
      try {
          await handleSaveToBlockchain();
      } catch (err) {
          toast.error("Failed to save to blockchain:", err);
      }
  });
  };

  return (
    <div className="main-container">
      <div className="content-block file-picker-block">
        {files.length === 0 ? (
          <>
            <h1 className="block-header">File/Folder Picker</h1>
            <button className="action-button" onClick={handleSelectFiles}>Select Files/Folders</button>
            <ul>
              {files.map((path, index) => (
                <li key={index}>{path}</li>
              ))}
            </ul>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="file-drop-area"
            >
              <h2>Drag and Drop a File Here</h2>
            </div>
          </>
        ) : (
          <>
            <h1 className="block-header">File/Folder Picker</h1>
            {files.length !== 0 && (
              <div className="file-preview custom-scrollbar">
                <h3>Preview:</h3>
                {fileContent.type === 'image' ? (
                  <img
                    src={fileContent.content}
                    alt="Preview"
                    style={{ maxWidth: '100%', borderRadius: '6px' }}
                  />
                ) : (
                  <pre>
                    {fileContent.content}
                  </pre>
                )}
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <button className="action-button cancel" onClick={handleCancel}>Cancel</button>
              <button className="action-button" onClick={handleSaveClick}>Save to blockchain</button>
            </div>
          </>
        )}
      </div>
      
      <div className="content-block status-block">
        <Status savedFiles={savedFiles}/>
      </div>
    </div>
  );
}

export default Homepage;