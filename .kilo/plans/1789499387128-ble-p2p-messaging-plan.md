# Talkes BLE P2P Messaging Plan

## Goal
Add real peer-to-peer Bluetooth LE discovery and messaging using `react-native-ble-plx`, replacing the current static `PEER_POOL` simulation. Two devices running the app should discover each other, connect, and exchange messages directly via BLE.

## Dependency
- **Library**: `react-native-ble-plx` (v3.x)
  - Supports React Native 0.87
  - iOS + Android
  - BLE central + peripheral roles
  - Actively maintained
  - Autolinking support

## Architecture

### Data Flow
```
App.tsx → usesBleMesh() hook → BleManager (react-native-ble-plx)
         → storage.ts (AsyncStorage for persistence)
         → mesh.ts (Talkes ID generation, peer pool)
```

### BLE Communication Protocol
- **Service UUID**: Custom (e.g., `0000feed-0000-1000-8000-00805f9b34fb`)
- **Characteristic UUID**: Custom for messages (e.g., `0000beef-0000-1000-8000-00805f9b34fb`)
- **Advertisement**: Broadcast Talkes ID + name via BLE advertisement
- **Discovery**: Scan for peripherals, parse advertised Talkes ID
- **Connection**: Connect to discovered peer, discover services/characteristics
- **Messaging**: Write messages to characteristic (peripheral side) / notify on characteristic change (central side)

### Roles
- **Both devices act as Central + Peripheral simultaneously**
  - Central: scans and connects to other devices
  - Peripheral: advertises and serves messages via GATT
  - This enables bidirectional messaging

## Tasks

### 1. Install and Link Library
- `npm install react-native-ble-plx`
- iOS: `cd ios && pod install`
- No manual linking needed (autolink)

### 2. Android Permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
```

### 3. iOS Permissions
Add to `ios/Talkes/Info.plist`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Talkes needs Bluetooth to discover nearby devices</key>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Talkes needs Bluetooth to broadcast your presence</key>
```

### 4. Create BLE Hook (`hooks/useBleMesh.ts`)
Custom hook that manages:
- BleManager initialization
- Permissions request (Android + iOS)
- Advertisement start (peripheral mode)
- Scanning for nearby peers (central mode)
- Device connection/disconnection handling
- GATT service/characteristic read/write
- Message sending/receiving via BLE characteristic notification
- Peer lifecycle: discovered → connected → messaging

### 5. Update `data/mesh.ts`
- Remove `PEER_POOL` static data
- Add BLE-specific constants (Service/Characteristic UUIDs)
- Add Talkes ID serialization for advertisement payload

### 6. Update `App.tsx`
- Replace `nearbyPeers` derived from `PEER_POOL` with BLE-discovered peers from hook
- Replace `isScanning` hardcoded `true` with hook state
- Integrate real message sending via BLE instead of AsyncStorage only
- Handle incoming BLE messages and update local state immediately
- Keep AsyncStorage persistence for message history

### 7. Update `NearbyDiscoveryScreen.tsx`
- Keep existing UI
- `onConnect` triggers actual BLE connection instead of simulated state change
- Show real scanning status from hook

### 8. Update `ChatScreen.tsx`
- Remove `networkStatus` prop or update it to reflect actual BLE connection state
- Messages sent via BLE writeCharacteristic
- Messages received via BLE setNotifyValue callback

## Key Design Decisions

1. **Both devices as Central + Peripheral**: Enables bidirectional discovery and messaging without a server. One limitation: Android peripheral mode requires API 21+ and works best with `react-native-ble-plx` v3+ which supports `startDeviceAdvertising`.

2. **Message size**: BLE MTU is typically 20 bytes. Messages longer than 20 bytes must be split into chunks and reassembled. Implementation should handle fragmentation.

3. **Message persistence**: Messages are still stored in AsyncStorage for history. Real-time delivery uses BLE notifications.

4. **Talkes ID in advertisement**: The 8-character Talkes ID (e.g., `TK-ABCD12`) plus device name can fit in 31-byte BLE advertisement payload.

## Risks & Mitigations

- **iOS BLE limitations**: `react-native-ble-plx` supports peripheral mode on iOS (for reading characteristics) but cannot actively advertise as peripheral. iOS devices can only discover and connect. **Mitigation**: iOS users can only connect to Android users in peripheral mode. Android-to-Android works full P2P.
- **MTU limits**: Long messages need chunking. **Mitigation**: Implement message segmentation in `useBleMesh.ts`.
- **Battery drain**: Continuous scanning + advertising drains battery. **Mitigation**: Allow user to toggle discoverability, limit advertising interval.
- **Connection loss**: BLE connections are unstable. **Mitigation**: Implement auto-reconnect logic and message queue for offline delivery.

## Validation
1. Run app on two Android devices
2. Verify both devices discover each other in NearbyDiscovery
3. Verify Talkes IDs appear correctly
4. Send message from device A → verify received on device B and vice versa
5. Verify messages persist in AsyncStorage after disconnect
6. Verify messages appear in chat immediately on both devices

## Open Questions (Out of Scope for Implementation)
1. iOS peripheral/advertising mode support is limited — only full P2P on Android Android. iOS can act as central and receive messages from Android peripherals but cannot initiate.
2. Message encryption (currently plaintext) — should end-to-end encryption be added later?
3. Multi-user mesh (3+ devices) — current design supports 1:1 pairing only.