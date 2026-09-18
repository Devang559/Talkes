export interface WiFiDirectPeer {
  deviceAddress: string;
  deviceName: string;
}

export interface FileTransferProgress {
  progress: number;
  bytesSent?: number;
  totalBytes?: number;
  bytesReceived?: number;
}

export interface FileReceived {
  filePath: string;
  fileName: string;
  fileSize: number;
}

export type FileTransferEventType =
  | 'WiFiDirectPeersFound'
  | 'WiFiDirectConnected'
  | 'WiFiDirectConnecting'
  | 'FileTransferProgress'
  | 'FileReceivingProgress'
  | 'FileTransferComplete'
  | 'FileReceived'
  | 'FileReceiveError'
  | 'ServerError'
  | 'ServerStarted';
