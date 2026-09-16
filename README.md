# Talkes

A privacy-first, serverless peer-to-peer messaging app for local mesh communication using Bluetooth LE (BLE). Talkes enables offline communication between nearby users without internet infrastructure.

## Features

- **Offline P2P Messaging**: Send and receive messages directly between devices via Bluetooth LE
- **Unique Talkes ID**: Persistent, unique identifier per device (survives app reinstalls)
- **No Servers**: All communication happens directly between devices - no internet required
- **Local Storage**: Messages are stored only on the device
- **BLE Discovery**: Devices discover each other automatically within range
- **Bidirectional Messaging**: Both devices can act as central and peripheral

## Screenshots

- **Nearby Discovery Screen**: Scan for and discover nearby Talkes users
- **Chat Screen**: Send and receive messages with real-time delivery via BLE
- **Connection Request**: Accept or reject connection requests from discovered peers

## Architecture

### Core Components

```
App.tsx                          - Main application logic, state management
├── hooks/useBleMesh.ts          - BLE communication hook (scanning, advertising, messaging)
├── data/
│   ├── mesh.ts                  - BLE constants, message encoding/decoding, ID generation
│   ├── storage.ts               - AsyncStorage persistence layer
│   └── avatars.ts               - Avatar generation from Talkes ID
├── screens/
│   ├── WelcomeScreen.tsx        - Onboarding with Talkes ID display
│   ├── DashboardScreen.tsx      - Main chat list view
│   ├── NearbyDiscoveryScreen.tsx - BLE peer discovery UI
│   ├── ChatScreen.tsx           - Chat interface
│   ├── ConnectionRequestScreen.tsx - Peer connection confirmation
│   └── SettingsScreen.tsx       - App settings and data management
└── android/app/src/main/java/com/talkes/ble/
    └── BleAdvertiserModule.kt    - Native Android BLE advertising & GATT server
```

### BLE Communication Flow

1. **Advertising (Peripheral Mode)**: Android devices broadcast their Talkes ID and name via BLE advertisements
2. **Scanning (Central Mode)**: Other devices scan for BLE advertisements and parse the Talkes ID
3. **Connection**: Central device connects to the peripheral device
4. **Message Exchange**: Messages are exchanged via GATT characteristic read/write operations
5. **Message Chunking**: Long messages are split into chunks to fit within BLE MTU limits

### Data Flow

```
User sends message
    ↓
Message stored in AsyncStorage (local persistence)
    ↓
Message encoded as JSON → Base64 → Chunked
    ↓
Each chunk sent via BLE GATT write (writeCharacteristicWithoutResponse)
    ↓
Receiving device: GATT write callback → Decode Base64 → Parse JSON → Reassemble chunks
    ↓
Reassembled message stored and displayed
```

### Talkes ID Persistence

The Talkes ID is generated once per device and persisted in AsyncStorage. It survives:
- App restarts
- App reinstalls (on the same device)
- Clearing local data (regenerates a new ID)

The ID is unique because it uses a 6-character alphanumeric code with 33 characters possible per position (excluding ambiguous characters like 0, O, I, 1).

## Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native` | 0.87.1 | Mobile framework |
| `react` | 19.2.3 | UI library |
| `react-native-ble-plx` | 3.5.1 | Bluetooth LE communication (central mode: scanning, connecting, GATT operations) |
| `@react-native-async-storage/async-storage` | 3.1.1 | Local message and profile persistence |
| `react-native-safe-area-context` | 5.5.2 | Safe area handling for notches and status bars |

### Why `react-native-ble-plx`?

- Actively maintained and well-documented BLE library
- Supports React Native 0.87+
- Handles both iOS and Android BLE operations (central role)
- Built-in promise-based API for async operations
- Supports MTU negotiation, characteristic monitoring, and reliable writes

### Native BLE Module (Android Only)

Since `react-native-ble-plx` doesn't support peripheral/advertising mode, a custom native Android module (`BleAdvertiserModule.kt`) was created to:
- Start/stop BLE advertising with Talkes ID payload
- Host a GATT server for receiving messages from central devices
- Handle characteristic read/write callbacks
- Enable bidirectional P2P communication between Android devices

## Permissions

### Android

Required permissions in `AndroidManifest.xml`:
- `BLUETOOTH_SCAN` - Discover nearby BLE devices
- `BLUETOOTH_CONNECT` - Connect to BLE devices
- `BLUETOOTH_ADVERTISE` - Broadcast as a BLE peripheral
- `ACCESS_FINE_LOCATION` - Required for BLE scanning
- `INTERNET` - (Already required by React Native)

### iOS

Required permissions in `Info.plist`:
- `NSBluetoothAlwaysUsageDescription` - Bluetooth access description
- `NSBluetoothPeripheralUsageDescription` - Bluetooth peripheral mode description

## Setup & Installation

### Prerequisites

- Node.js >= 22.11.0
- Android Studio (for Android builds)
- Xcode (for iOS builds)
- Android SDK API 21+ (for BLE advertising support)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Talkes

# Install dependencies
npm install

# For iOS (requires CocoaPods)
cd ios && pod install && cd ..
```

### Building & Running

```bash
# Run on Android
npm run android

# Run on iOS
npm run ios

# Start Metro bundler
npm start

# Run linting
npm run lint

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

## Platform Support

### Android-to-Android
Full P2P support: both devices can advertise, scan, connect, and exchange messages.

### iOS-to-Android
Limited support: iOS devices can connect to Android peripherals but cannot advertise or act as peripherals (iOS restriction).

### iOS-to-iOS
No P2P support via BLE due to iOS restrictions on peripheral mode advertising.

## Usage

### Getting Started

1. Open the app
2. Grant Bluetooth and Location permissions when prompted
3. Enter your display name
4. Tap "START MESSAGING"

### Chatting with Nearby Users

1. Go to the **Nearby** tab
2. Tap the 🔍 icon to scan for nearby Talkes users
3. Tap **Connect** on a discovered peer
4. Accept the connection request
5. Start messaging

### Advertising (Android Only)

1. On the Nearby Discovery screen, tap "Not Listening"
2. The button changes to "Listening" indicating the device is advertising
3. Other devices can now discover and connect to your device

## Development

### Project Structure

```
Talkes/
├── android/                    # Android native project
├── ios/                        # iOS native project
├── hooks/                      # Custom React hooks
│   └── useBleMesh.ts          # BLE mesh networking hook
├── data/                       # Data layer
│   ├── mesh.ts                # BLE constants and encoding utilities
│   ├── storage.ts             # AsyncStorage persistence
│   └── avatars.ts             # Avatar generation
├── screens/                    # React Native screens
│   ├── WelcomeScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── NearbyDiscoveryScreen.tsx
│   ├── ChatScreen.tsx
│   ├── ConnectionRequestScreen.tsx
│   └── SettingsScreen.tsx
├── components/                 # Reusable components
│   ├── BottomTabBar.tsx
│   └── ...
├── theme/                      # Color and spacing themes
└── App.tsx                    # Main application entry
```

### BLE Protocol Details

**Service UUID**: `0000feed-0000-1000-8000-00805f9b34fb`

**Characteristics**:
- `0000cafe-0000-1000-8000-00805f9b34fb` (TX) - Notify messages received by central
- `0000babe-0000-1000-8000-00805f9b34fb` (RX) - Write messages from central to peripheral

**Message Format**:
```json
{
  "messageId": "string",
  "timestamp": number,
  "text": "string",
  "isMine": boolean,
  "chunkIndex": number,
  "totalChunks": number,
  "recipientId": "string"
}
```

Messages are Base64 encoded as the BLE characteristic value and chunked if longer than MTU - 3 bytes.

## License

This project is licensed under the MIT License.
