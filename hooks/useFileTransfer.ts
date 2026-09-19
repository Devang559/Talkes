import { useCallback, useState, useEffect } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';

interface UseFileTransferProps {
  onFileReceived: (file: {
    filePath: string;
    fileName: string;
    fileSize: number;
  }) => void;
  onTransferProgress: (progress: {
    progress: number;
    bytes: number;
    total: number;
  }) => void;
  onConnected: (groupOwner: string) => void;
  onPeersFound: (
    peers: Array<{ deviceAddress: string; deviceName: string }>
  ) => void;
}

export const useFileTransfer = ({
  onFileReceived,
  onTransferProgress,
  onConnected,
  onPeersFound,
}: UseFileTransferProps) => {
  const [isWifiDirectSupported, setIsWifiDirectSupported] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedPeerAddress, setConnectedPeerAddress] = useState<string | null>(null);
  const [groupOwnerAddress, setGroupOwnerAddress] = useState<string | null>(null);
  const [isServerRunning, setIsServerRunning] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const WiFiDirect = NativeModules.WiFiDirect;
    if (!WiFiDirect) return;

    const eventEmitter = new NativeEventEmitter(WiFiDirect);

    const subscription = eventEmitter.addListener(
      'WiFiDirectEvent',
      (event: any) => {
        switch (event.type) {
          case 'WiFiDirectConnected':
            setConnectedPeerAddress(event.groupOwnerAddress);
            setGroupOwnerAddress(event.groupOwnerAddress);
            setIsConnecting(false);
            onConnected(event.groupOwnerAddress);
            break;
          case 'WiFiDirectPeersFound':
            onPeersFound(event.peers || []);
            break;
          case 'FileTransferProgress':
            onTransferProgress({
              progress: event.progress,
              bytes: event.bytesSent || 0,
              total: event.totalBytes || 0,
            });
            break;
          case 'FileReceivingProgress':
            onTransferProgress({
              progress: event.progress,
              bytes: event.bytesReceived || 0,
              total: event.totalBytes || 0,
            });
            break;
          case 'FileReceived':
            onFileReceived({
              filePath: event.filePath,
              fileName: event.fileName,
              fileSize: event.fileSize,
            });
            break;
          case 'FileTransferComplete':
            onTransferProgress({
              progress: 100,
              bytes: event.fileSize,
              total: event.fileSize,
            });
            break;
          case 'WiFiDirectConnecting':
            setIsConnecting(true);
            break;
          case 'ServerStarted':
            setIsServerRunning(true);
            break;
        }
      }
    );

    return () => subscription.remove();
  }, [onFileReceived, onTransferProgress, onConnected, onPeersFound]);

  const checkWifiP2pSupport = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    const WiFiDirect = NativeModules.WiFiDirect;
    if (!WiFiDirect) return false;

    try {
      const supported = await WiFiDirect.isWifiP2pSupported();
      setIsWifiDirectSupported(supported);
      return supported;
    } catch {
      return false;
    }
  }, []);

  const startDiscovery = useCallback(async () => {
    if (Platform.OS !== 'android') return [];

    const WiFiDirect = NativeModules.WiFiDirect;
    if (!WiFiDirect) return [];

    try {
      const result = await WiFiDirect.startDiscovery();
      return result;
    } catch {
      return false;
    }
  }, []);

  const connectToDevice = useCallback(
    async (deviceAddress: string): Promise<boolean> => {
      if (Platform.OS !== 'android') return false;

      const WiFiDirect = NativeModules.WiFiDirect;
      if (!WiFiDirect) return false;

      setIsConnecting(true);
      try {
        await WiFiDirect.connectToDevice(deviceAddress);
        return true;
      } catch {
        setIsConnecting(false);
        return false;
      }
    },
    []
  );

  const startServer = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    const WiFiDirect = NativeModules.WiFiDirect;
    if (!WiFiDirect) return false;

    try {
      await WiFiDirect.startServer();
      return true;
    } catch {
      return false;
    }
  }, []);

  const stopServer = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    const WiFiDirect = NativeModules.WiFiDirect;
    if (!WiFiDirect) return false;

    try {
      await WiFiDirect.stopServer();
      setIsServerRunning(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const createGroup = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    const WiFiDirect = NativeModules.WiFiDirect;
    if (!WiFiDirect) return false;

    try {
      await WiFiDirect.createGroup();
      return true;
    } catch {
      return false;
    }
  }, []);

  const sendFile = useCallback(
    async (filePath: string, peerAddress: string): Promise<boolean> => {
      if (Platform.OS !== 'android') return false;

      const WiFiDirect = NativeModules.WiFiDirect;
      if (!WiFiDirect) return false;

      try {
        await WiFiDirect.sendFile(filePath, peerAddress);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const selectAndSendFile = useCallback(
    async (peerAddress: string): Promise<boolean> => {
      try {
        const result = await DocumentPicker.pickSingle({
          type: [
            DocumentPicker.types.images,
            DocumentPicker.types.video,
            DocumentPicker.types.audio,
            DocumentPicker.types.pdf,
            DocumentPicker.types.doc,
            DocumentPicker.types.docx,
          ],
        });

        const localUri = result.uri;
        const filePath = localUri.replace('file://', '');
        await sendFile(filePath, peerAddress);
        return true;
      } catch (e: any) {
        if (!DocumentPicker.isCancel(e)) {
          console.error('Document picker error:', e);
        }
        return false;
      }
    },
    [sendFile]
  );

  const sendFileToPeer = useCallback(
    async (peerAddress: string): Promise<boolean> => {
      const result = await DocumentPicker.pickSingle({
        type: [
          DocumentPicker.types.images,
          DocumentPicker.types.video,
          DocumentPicker.types.audio,
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
        ],
      });

      const localUri = result.uri;
      const filePath = localUri.replace('file://', '');
      return await sendFile(filePath, peerAddress);
    },
    [sendFile]
  );

  return {
    isWifiDirectSupported,
    isConnecting,
    connectedPeerAddress,
    groupOwnerAddress,
    isServerRunning,
    checkWifiP2pSupport,
    startDiscovery,
    connectToDevice,
    startServer,
    stopServer,
    createGroup,
    sendFile,
    selectAndSendFile,
    sendFileToPeer,
  };
};

export default useFileTransfer;
