import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { BleManager, Device, BleError, State } from 'react-native-ble-plx';
import {
  BLE_SERVICE_UUID,
  BLE_TX_UUID,
  BLE_RX_UUID,
  decodeBlePayload,
  encodeMessageBase64,
  decodeMessageBase64,
  chunkMessage,
  generateMessageId,
  BleMessagePayload,
  getRandomSignalColor,
} from '../data/mesh';
import { Platform, PermissionsAndroid, NativeModules, NativeEventEmitter } from 'react-native';
import { Peer } from '../screens/NearbyDiscoveryScreen';
import { getAvatarIndexForId, getAvatarUri } from '../data/avatars';

interface UseBleMeshOptions {
  talkesId: string;
  onMessageReceived: (peerHandle: string, text: string, timestamp: number) => void;
  onPeerConnected: (peerHandle: string) => void;
  onPeerDisconnected: (peerHandle: string) => void;
}

interface UseBleMeshResult {
  isScanning: boolean;
  isAdvertising: boolean;
  isConnected: boolean;
  hasPermission: boolean;
  knownPeers: Peer[];
  requestPermissions: () => Promise<boolean>;
  startScan: () => void;
  stopScan: () => void;
  startAdvertising: () => void;
  stopAdvertising: () => void;
  sendMessage: (peerHandle: string, text: string) => Promise<boolean>;
  connectToDevice: (peer: Peer) => Promise<void>;
  disconnectFromDevice: (peerHandle: string) => Promise<void>;
}

const CHUNK_SIZE = 18;
const MAX_MTU = 517;

export const useBleMesh = ({
  talkesId,
  onMessageReceived,
  onPeerConnected,
  onPeerDisconnected,
}: UseBleMeshOptions): UseBleMeshResult => {
   const [isScanning, setIsScanning] = useState(false);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [knownPeers, setKnownPeers] = useState<Peer[]>([]);

  const managerRef = useRef<BleManager | null>(null);
  const peerHandleToDeviceIdMapRef = useRef<Map<string, string>>(new Map());
  const connectedPeersRef = useRef<Map<string, { deviceId: string; name: string }>>(new Map());
  const messageBufferRef = useRef<Map<string, BleMessagePayload[]>>(new Map());
  const subscriptionsRef = useRef<{ remove: () => void }[]>([]);
  const currentMtuRef = useRef<number>(23);

  const setupManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new BleManager();
    }
    return managerRef.current;
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const manager = setupManager();
    const state = await manager.state();

    if ((state as State) === State.PoweredOn) {
      const locationGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      const btGranted = await Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE),
      ]).then(results => results.every(v => v));

      if (locationGranted && btGranted) {
        setHasPermission(true);
        return true;
      }
    }

    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = Object.values(granted).every(
        v => v === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (allGranted) {
        const newState = await manager.state();
        const poweredOn = (newState as State) === State.PoweredOn;
        setHasPermission(poweredOn);
        return poweredOn;
      }
      setHasPermission(false);
      return false;
    }

    const result = (state as State) === State.PoweredOn;
    setHasPermission(result);
    return result;
  }, [setupManager]);

  const parseScanData = (device: Device): { talkesId: string; name: string } | null => {
    try {
      if (device.serviceData) {
        const serviceData = device.serviceData as Record<string, string>;
        for (const [key, value] of Object.entries(serviceData)) {
          if (key && value) {
            try {
              const hexString = decodeMessageBase64(value);
              const decoded = decodeBlePayload(hexString);
              if (decoded) return decoded;
            } catch {
              continue;
            }
          }
        }
      }

      if (device.manufacturerData) {
        const decoded = decodeBlePayload(device.manufacturerData);
        if (decoded) return decoded;
      }

      if (device.localName) {
        return { talkesId: device.localName, name: device.localName };
      }

      return null;
    } catch {
      return null;
    }
  };

  const startScan = useCallback(() => {
    const manager = setupManager();
    setIsScanning(true);

    const subscription = manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        setIsScanning(true);
        manager.startDeviceScan(
          [BLE_SERVICE_UUID],
          { allowDuplicates: false },
          (error: BleError | null, device: Device | null) => {
            if (error) {
              console.warn('BLE scan error:', error.message);
              return;
            }
            if (!device) return;

            const decoded = parseScanData(device);
            if (!decoded || !decoded.talkesId || decoded.talkesId === talkesId) return;

            peerHandleToDeviceIdMapRef.current.set(decoded.talkesId, device.id);

            setKnownPeers((prevPeers) => {
              const existingIndex = prevPeers.findIndex((p) => p.id === decoded.talkesId);
              const peer: Peer = {
                id: decoded.talkesId,
                name: decoded.name || 'Unknown',
                handle: decoded.talkesId,
                avatar: getAvatarUri(getAvatarIndexForId(decoded.talkesId)),
                signalColor: getRandomSignalColor(),
                status: connectedPeersRef.current.has(decoded.talkesId) ? 'active' : 'connect',
              };

              if (existingIndex >= 0) {
                const newPeers = [...prevPeers];
                newPeers[existingIndex] = peer;
                return newPeers;
              }
              return [...prevPeers, peer];
            });
          },
        );

        setTimeout(() => {
          setIsScanning(false);
          manager.stopDeviceScan();
        }, 30000);
      } else if (state === 'PoweredOff' || state === 'Unauthorized' || state === 'Unsupported') {
        setIsScanning(false);
      }
    }, true);

    subscriptionsRef.current.push({ remove: () => subscription.remove() });
  }, [talkesId, setupManager]);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    if (managerRef.current) {
      managerRef.current.stopDeviceScan();
    }
  }, []);

  const startAdvertising = useCallback(async () => {
    if (Platform.OS === 'android') {
    const { BleAdvertiser } = NativeModules;
    if (BleAdvertiser) {
        try {
          await BleAdvertiser.startAdvertising(talkesId, 'Talkes');
          setIsAdvertising(true);
        } catch (err) {
          console.warn('BLE advertising failed:', err);
        }
      }
    } else {
      setIsAdvertising(true);
    }
  }, [talkesId]);

  const stopAdvertising = useCallback(async () => {
    if (Platform.OS === 'android') {
    const { BleAdvertiser } = NativeModules;
    if (BleAdvertiser) {
        try {
          await BleAdvertiser.stopAdvertising();
        } catch (err) {
          console.warn('BLE stop advertising failed:', err);
        }
      }
    }
    setIsAdvertising(false);
  }, []);

  const handleIncomingMessage = useCallback(
    (base64Data: string) => {
      try {
        const decoded = decodeMessageBase64(base64Data);
        const payload: BleMessagePayload = JSON.parse(decoded);

        if (payload.chunkIndex === 0) {
          messageBufferRef.current.set(payload.messageId, []);
        }

        const chunks = messageBufferRef.current.get(payload.messageId) || [];
        chunks.push(payload);
        messageBufferRef.current.set(payload.messageId, chunks);

        if (payload.chunkIndex === payload.totalChunks - 1) {
          const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
          const fullText = sortedChunks.map((c) => c.text).join('');
          messageBufferRef.current.delete(payload.messageId);

          onMessageReceived(payload.recipientId, fullText, payload.timestamp);
        }
      } catch (err) {
        console.error('BLE message decode error:', err);
      }
    },
    [onMessageReceived],
  );

  const handleIncomingMessageFromAdvertisedDevice = useCallback(
     (message: string) => {
      try {
        const payload: BleMessagePayload = JSON.parse(message);

        if (payload.chunkIndex === 0) {
          messageBufferRef.current.set(payload.messageId, []);
        }

        const chunks = messageBufferRef.current.get(payload.messageId) || [];
        chunks.push(payload);
        messageBufferRef.current.set(payload.messageId, chunks);

        if (payload.chunkIndex === payload.totalChunks - 1) {
          const sortedChunks = chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
          const fullText = sortedChunks.map((c) => c.text).join('');
          messageBufferRef.current.delete(payload.messageId);

          onMessageReceived(payload.recipientId, fullText, payload.timestamp);
        }
      } catch (err) {
        console.error('BLE native message decode error:', err);
      }
    },
    [onMessageReceived],
  );

  const connectToDevice = useCallback(async (peer: Peer) => {
    const manager = setupManager();
    const deviceId = peerHandleToDeviceIdMapRef.current.get(peer.id);

    if (!deviceId) return;

    try {
      const device = await manager.connectToDevice(deviceId, {
        autoConnect: false,
      });

      device.onDisconnected(() => {
        connectedPeersRef.current.delete(peer.id);
        peerHandleToDeviceIdMapRef.current.delete(peer.id);
        onPeerDisconnected(peer.id);
        setKnownPeers((prev) =>
          prev.map((p) =>
            p.id === peer.id
              ? { ...p, status: 'connect' }
              : p,
          ),
        );
      });

      await device.discoverAllServicesAndCharacteristics();
      const mtuResult = await device.requestMTU(MAX_MTU);
      currentMtuRef.current = mtuResult.mtu;

      const monitorSub = device.monitorCharacteristicForService(
        BLE_SERVICE_UUID,
        BLE_TX_UUID,
        (error, characteristic) => {
          if (error) {
            console.warn('BLE monitor error:', error.message);
            return;
          }
          if (characteristic?.value) {
            handleIncomingMessage(characteristic.value);
          }
        },
      );
      if (monitorSub && typeof monitorSub.remove === 'function') {
        subscriptionsRef.current.push(monitorSub);
      }

      connectedPeersRef.current.set(peer.id, {
        deviceId: deviceId,
        name: peer.name,
      });
      onPeerConnected(peer.id);

      setKnownPeers((prev) =>
        prev.map((p) =>
          p.id === peer.id ? { ...p, status: 'active' } : p,
        ),
      );
      setIsConnected(true);
    } catch (err) {
      console.error('BLE connect error:', err);
    }
  }, [setupManager, onPeerConnected, onPeerDisconnected, handleIncomingMessage]);

  const sendMessage = useCallback(
    async (peerHandle: string, text: string): Promise<boolean> => {
      const manager = setupManager();
      const deviceId = peerHandleToDeviceIdMapRef.current.get(peerHandle);

      if (!deviceId) {
        console.warn('BLE: Cannot send message - not connected to', peerHandle);
        return false;
      }

      const device = (await manager.devices([deviceId])).find(
        (d) => d.id === deviceId,
      );

      if (!device) {
        console.warn('BLE: Device not found', deviceId);
        return false;
      }

      const messageId = generateMessageId();
      const timestamp = Date.now();
      const mtu = currentMtuRef.current;
      const maxPayloadSize = mtu - 3;
      const chunkSize = Math.min(CHUNK_SIZE, maxPayloadSize);

      const chunks = chunkMessage(text, chunkSize);

      try {
        for (let i = 0; i < chunks.length; i++) {
          const payload: BleMessagePayload = {
            messageId,
            timestamp,
            text: chunks[i],
            isMine: true,
            chunkIndex: i,
            totalChunks: chunks.length,
            recipientId: talkesId,
          };

          const base64 = encodeMessageBase64(JSON.stringify(payload));

          await device.writeCharacteristicWithoutResponseForService(
            BLE_SERVICE_UUID,
            BLE_RX_UUID,
            base64,
          );
        }
        return true;
      } catch (err) {
        console.error('BLE send error:', err);
        return false;
      }
    },
    [talkesId, setupManager],
  );

  const disconnectFromDevice = useCallback(
    async (peerHandle: string): Promise<void> => {
      const manager = setupManager();
      const deviceId = peerHandleToDeviceIdMapRef.current.get(peerHandle);

      if (deviceId) {
        try {
          await manager.cancelDeviceConnection(deviceId);
        } catch (err) {
          console.error('BLE disconnect error:', err);
        }
        peerHandleToDeviceIdMapRef.current.delete(peerHandle);
        connectedPeersRef.current.delete(peerHandle);
        onPeerDisconnected(peerHandle);
      }
    },
    [setupManager, onPeerDisconnected],
  );

  useEffect(() => {
    requestPermissions();

    const { BleAdvertiser } = NativeModules;
    if (BleAdvertiser && Platform.OS === 'android') {
      const eventEmitter = new NativeEventEmitter(BleAdvertiser);
      const subscription = eventEmitter.addListener(
        'BleMessageReceived',
        (event: any) => {
          handleIncomingMessageFromAdvertisedDevice(event.message);
        },
      );
      return () => {
        subscription.remove();
        stopScan();
        subscriptionsRef.current.forEach((sub) => sub.remove());
        subscriptionsRef.current = [];
        if (managerRef.current) {
          managerRef.current.destroy();
          managerRef.current = null;
        }
      };
    }

    return () => {
      stopScan();
      subscriptionsRef.current.forEach((sub) => sub.remove());
      subscriptionsRef.current = [];
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, [requestPermissions, stopScan, handleIncomingMessageFromAdvertisedDevice]);

  return {
    isScanning,
    isAdvertising,
    isConnected,
    hasPermission,
    knownPeers,
    requestPermissions,
    startScan,
    stopScan,
    startAdvertising,
    stopAdvertising,
    sendMessage,
    connectToDevice,
    disconnectFromDevice,
  };
};

export default useBleMesh;
