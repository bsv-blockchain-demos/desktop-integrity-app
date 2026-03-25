export type FileContentType = 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary';

export interface FileContent {
  /** The detected file type, used to choose the correct preview renderer */
  type: FileContentType;
  /** Display value: plain text string for 'text', data URL for image/pdf/audio/video, empty string for 'binary' */
  content: string;
  /** Raw file bytes — always present, used for hashing and encryption */
  bytes: number[];
  name: string;
}

export interface FileStats {
  size: number;
  modifiedTS: string;
  createdTS: string;
}

export interface FileStatus {
  txID: string;
  satoshis: string;
  time: string;
}

export interface SavedFile {
  fileName: string;
  status: FileStatus;
}

export interface LogEntry {
  name: string;
  content: string;
  isoTimestamp: string | null;
  timestamp: string | null;
  originalName: string;
}

export interface LogData {
  SavedFile?: string;
  Time?: string;
  TxID?: string;
  Satoshis?: string;
  SavedWithKeyID?: string;
  FileCreatedTS?: string;
  FileModifiedTS?: string;
  OriginalFileSize?: string;
  [key: string]: string | undefined;
}
