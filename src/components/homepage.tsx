import React, { useCallback, useEffect } from 'react';
import { useFile } from '../../context/fileContext';
import Status from './status';
import '../css/layout.css';
import globalQueue from '../../utils/queueHandler';
import { toast } from 'react-hot-toast';
import type { FileContent } from '../../types/index';

function FilePreview({ fileContent }: { fileContent: FileContent }) {
  switch (fileContent.type) {
    case 'image':
      return <img src={fileContent.content} alt="Preview" style={{ maxWidth: '100%', borderRadius: '6px' }} />;
    case 'pdf':
      return <embed src={fileContent.content} width="100%" height="600px" title="PDF Preview" />;
    case 'audio':
      return <audio controls src={fileContent.content} style={{ width: '100%' }} />;
    case 'video':
      return <video controls src={fileContent.content} style={{ maxWidth: '100%', borderRadius: '6px' }} />;
    case 'text':
      return <pre>{fileContent.content}</pre>;
    default:
      return <p style={{ color: '#aaa' }}>No preview available for this file type.</p>;
  }
}

function Homepage() {
  const { files, setFiles, fileContent, setFilePath, handleCancel, savedFiles, handleSaveToBlockchain } = useFile();

  const handleSelectFiles = async () => {
    if (window.electronAPI?.openDialog) {
      const selected = await window.electronAPI.openDialog();
      if (selected && selected.length > 0) {
        console.log("selected", selected);
        setFiles([selected]);
        setFilePath(selected);
      }
    } else {
      console.error("Electron API not available");
    }
  };

  useEffect(() => {
    setFiles([]);
    setFilePath('');
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0] as File & { path: string };
    console.log("droppedFile", droppedFile);
    if (droppedFile && droppedFile.path) {
      setFilePath(droppedFile.path);
      setFiles([droppedFile.path]);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSaveClick = () => {
    globalQueue.enqueue(async () => {
      try {
        await handleSaveToBlockchain();
      } catch (err) {
        toast.error("Failed to save to blockchain: " + err);
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
            {fileContent && (
              <div className="file-preview custom-scrollbar">
                <h3>Preview:</h3>
                <FilePreview fileContent={fileContent} />
              </div>
            )}
            <div className="button-container">
              <button className="action-button cancel" onClick={handleCancel}>Cancel</button>
              <button className="action-button" onClick={handleSaveClick}>Save to blockchain</button>
            </div>
          </>
        )}
      </div>

      <div className="content-block status-block">
        <Status savedFiles={savedFiles} />
      </div>
    </div>
  );
}

export default Homepage;
