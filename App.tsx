import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StatusBar, Animated, Platform } from 'react-native';
import WelcomeScreen from './screens/WelcomeScreen';
import DashboardScreen, { Conversation } from './screens/DashboardScreen';
import NearbyDiscoveryScreen, { Peer } from './screens/NearbyDiscoveryScreen';
import ConnectionRequestScreen from './screens/ConnectionRequestScreen';
import ChatScreen, { Message } from './screens/ChatScreen';
import SettingsScreen from './screens/SettingsScreen';
import { TabKey } from './components/BottomTabBar';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  fadeContainer: {
    flex: 1,
  },
});

import {
  storage,
  StoredUserProfile,
  StoredConnection,
  StoredMessage,
  StoredSettings,
  StoredFile,
} from './data/storage';
import {
  generateTalkesId,
  generateDeviceId,
} from './data/mesh';
import { useBleMesh } from './hooks/useBleMesh';
import { useFileTransfer } from './hooks/useFileTransfer';
import {
  getAvatarUri,
  getAvatarUriForId,
  getAvatarIndexForId,
} from './data/avatars';

type Screen = 'welcome' | 'main' | 'connectionRequest' | 'chat';

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatMessageTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(timestamp: number): string {
  const d = new Date(timestamp);
  return `Today, ${d.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
  })}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function connectionToScreenPeer(conn: StoredConnection): Peer {
  return {
    id: conn.peerId,
    name: conn.peerName,
    handle: conn.peerHandle,
    avatar: conn.peerAvatar,
    signalColor: conn.peerSignalColor,
    status: conn.status === 'connected' ? 'active' : 'connect',
  };
}

function storedToScreenMessages(stored: StoredMessage[]): Message[] {
  return stored.map((m) => ({
    id: m.id,
    text: m.text,
    time: formatMessageTime(m.timestamp),
    isMine: m.isMine,
    isRead: m.isRead,
  }));
}

const FadeTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.fadeContainer, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(
    null,
  );
  const [welcomeTalkesId, setWelcomeTalkesId] = useState<string | null>(
    null,
  );
  const [connections, setConnections] = useState<StoredConnection[]>([]);
  const [messagesByPeer, setMessagesByPeer] = useState<
    Record<string, StoredMessage[]>
  >({});
  const [_filesByPeer, setFilesByPeer] = useState<
    Record<string, StoredFile[]>
  >({});
  const [currentChatPeer, setCurrentChatPeer] = useState<Peer | null>(null);
  const [pendingRequest, setPendingRequest] = useState<Peer | null>(null);
  const [settings, setSettings] = useState<StoredSettings>({
    discoverable: true,
  });
  const [isReady, setIsReady] = useState(false);
  const [wifiDirectPeerAddress, setWifiDirectPeerAddress] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const [profile, conns, msgs, savedSettings, storedTalkesId, deviceId, files] =
        await Promise.all([
          storage.getUserProfile(),
          storage.getConnections(),
          storage.getMessages(),
          storage.getSettings(),
          storage.getStoredTalkesId(),
          storage.getDeviceId(),
          storage.getFiles(),
        ]);

      let activeTalkesId = storedTalkesId;
      if (!activeTalkesId) {
        activeTalkesId = generateTalkesId();
        await storage.saveTalkesId(activeTalkesId);
      }
      setWelcomeTalkesId(activeTalkesId);

      if (!deviceId) {
        const newDeviceId = generateDeviceId();
        await storage.saveDeviceId(newDeviceId);
      }

      if (profile) {
        setUserProfile(profile);
        setConnections(conns);
        setMessagesByPeer(msgs);
        setFilesByPeer(files);
        setSettings(savedSettings);
        setScreen('main');
      }

      setIsReady(true);
    };
    init();
  }, []);

  // --- Derived values ---

  const connectedPeerIds = useMemo(
    () =>
      new Set(
        connections.filter((c) => c.status === 'connected').map((c) => c.peerId),
      ),
    [connections],
  );

  const conversations = useMemo<Conversation[]>(() => {
    return [...connections]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((conn) => {
        const stored = messagesByPeer[conn.peerId] || [];
        const lastMsg = stored[stored.length - 1];
        return {
          id: conn.peerId,
          name: conn.peerName,
          handle: conn.peerHandle,
          lastMessage: lastMsg ? lastMsg.text : 'Connected. Say hello!',
          timeAgo: lastMsg ? formatTimeAgo(lastMsg.timestamp) : '',
          avatar: conn.peerAvatar,
          statusColor: conn.peerSignalColor,
        };
      });
  }, [connections, messagesByPeer]);

  const userAvatarUri = useMemo(() => {
    if (userProfile) {
      return getAvatarUri(userProfile.avatarIndex);
    }
    if (welcomeTalkesId) {
      return getAvatarUriForId(welcomeTalkesId);
    }
    return getAvatarUri(0);
  }, [userProfile, welcomeTalkesId]);

  const userTalkesId = userProfile?.talkesId ?? welcomeTalkesId ?? '';

  const handleBleMessageReceived = useCallback(
    (peerHandle: string, text: string, timestamp: number) => {
      const message: StoredMessage = {
        id: generateMessageId(),
        text,
        timestamp,
        isMine: false,
        isRead: true,
      };

      setMessagesByPeer((prev) => {
        const peerMessages = prev[peerHandle] || [];
        const hasMessage = peerMessages.some((m) => m.id === message.id);
        if (hasMessage) return prev;
        return {
          ...prev,
          [peerHandle]: [...peerMessages, message],
        };
      });
      storage.addMessage(peerHandle, message);
    },
    [],
  );

  const handleBlePeerConnected = useCallback((peerHandle: string) => {
    const now = Date.now();
    setConnections((prevConns) => {
      const existing = prevConns.find((c) => c.peerId === peerHandle);
      if (existing && existing.status === 'connected') return prevConns;

      const conn: StoredConnection = {
        peerId: peerHandle,
        peerName: 'Unknown',
        peerHandle: peerHandle,
        peerAvatar: '',
        peerSignalColor: '#3E7BFA',
        status: 'connected',
        updatedAt: now,
      };

      return existing
        ? prevConns.map((c) => (c.peerId === peerHandle ? { ...conn } : c))
        : [...prevConns, conn];
    });
  }, []);

  const handleBlePeerDisconnected = useCallback((peerHandle: string) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.peerId === peerHandle
          ? { ...c, status: 'disconnected' as const, updatedAt: Date.now() }
          : c,
      ),
    );
  }, []);

  const bleMesh = useBleMesh({
    talkesId: userTalkesId,
    onMessageReceived: handleBleMessageReceived,
    onPeerConnected: handleBlePeerConnected,
    onPeerDisconnected: handleBlePeerDisconnected,
  });

  const fileTransfer = useFileTransfer({
    onFileReceived: (file) => {
      const storedFile: StoredFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileUri: file.filePath,
        mimeType: 'application/octet-stream',
        timestamp: Date.now(),
        peerId: currentChatPeer?.id ?? '',
        isMine: false,
      };

      setFilesByPeer((prev) => ({
        ...prev,
        [storedFile.peerId]: [
          ...(prev[storedFile.peerId] || []),
          storedFile,
        ],
      }));
      storage.addFile(storedFile.peerId, storedFile);
    },
    onTransferProgress: (_progress) => {
    },
    onConnected: (groupOwner) => {
      setWifiDirectPeerAddress(groupOwner);
    },
    onPeersFound: (_peers) => {
    },
  });

  // --- Start WiFi Direct server on app init so we can receive files ---
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const initWifiDirect = async () => {
      try {
        const supported = await fileTransfer.checkWifiP2pSupport();
        if (supported) {
          await fileTransfer.startServer();
        }
      } catch {
        // WiFi Direct server start failure is non-fatal
      }
    };
    initWifiDirect();

    return () => {
      if (Platform.OS === 'android') {
        fileTransfer.stopServer().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearbyPeers = useMemo<Peer[]>(() => {
    return bleMesh.knownPeers.map((p) => ({
      ...p,
      status: connectedPeerIds.has(p.id) ? 'active' : p.status,
    }));
  }, [bleMesh.knownPeers, connectedPeerIds]);

  const chatMessages = useMemo<Message[]>(() => {
    if (!currentChatPeer) return [];
    return storedToScreenMessages(
      messagesByPeer[currentChatPeer.id] || [],
    );
  }, [currentChatPeer, messagesByPeer]);

  const chatIsOnline = useMemo(() => {
    if (!currentChatPeer) return false;
    const conn = connections.find((c) => c.peerId === currentChatPeer.id);
    return conn?.status === 'connected';
  }, [currentChatPeer, connections]);

  const chatNetworkStatus = chatIsOnline
    ? 'Network: Mesh Stable'
    : 'Network: Disconnected';

  const chatDateLabel = useMemo(() => {
    const peerMessages = currentChatPeer
      ? messagesByPeer[currentChatPeer.id] || []
      : [];
    if (peerMessages.length > 0) {
      return formatDateLabel(peerMessages[peerMessages.length - 1].timestamp);
    }
    return formatDateLabel(Date.now());
  }, [currentChatPeer, messagesByPeer]);

  // --- Handlers ---

  const handleStartMessaging = async (name: string) => {
    if (!welcomeTalkesId) return;
    const profile: StoredUserProfile = {
      name: name || 'User',
      talkesId: welcomeTalkesId,
      avatarIndex: getAvatarIndexForId(welcomeTalkesId),
    };
    await storage.saveUserProfile(profile);
    setUserProfile(profile);
    setScreen('main');
    setActiveTab('home');
  };

  const handleConnect = async (peer: Peer) => {
    await bleMesh.connectToDevice(peer);
    setPendingRequest(peer);
    setScreen('connectionRequest');
  };

  const handleAccept = async () => {
    if (!pendingRequest) return;

    const now = Date.now();
    const connection: StoredConnection = {
      peerId: pendingRequest.id,
      peerName: pendingRequest.name,
      peerHandle: pendingRequest.handle,
      peerAvatar: pendingRequest.avatar,
      peerSignalColor: pendingRequest.signalColor,
      status: 'connected',
      updatedAt: now,
    };

    const updatedConnections = await storage.addConnection(connection);
    setConnections(updatedConnections);

    const welcomeText = "Hello! I'm here on the mesh.";
    const seedMessage: StoredMessage = {
      id: generateMessageId(),
      text: welcomeText,
      timestamp: now,
      isMine: false,
      isRead: true,
    };

    setMessagesByPeer((prev) => ({
      ...prev,
      [pendingRequest.id]: [
        ...(prev[pendingRequest.id] || []),
        seedMessage,
      ],
    }));
    await storage.addMessage(pendingRequest.id, seedMessage);

    setCurrentChatPeer({
      id: pendingRequest.id,
      name: pendingRequest.name,
      handle: pendingRequest.handle,
      avatar: pendingRequest.avatar,
      signalColor: pendingRequest.signalColor,
      status: 'active',
    });
    setPendingRequest(null);
    setScreen('chat');
  };

  const handleReject = () => {
    setPendingRequest(null);
    setScreen('main');
    setActiveTab('nearby');
  };

  const handleSend = async (text: string) => {
    if (!currentChatPeer) return;

    const conn = connections.find(
      (c) => c.peerId === currentChatPeer.id,
    );
    if (!conn || conn.status !== 'connected') return;

    const now = Date.now();
    const message: StoredMessage = {
      id: generateMessageId(),
      text,
      timestamp: now,
      isMine: true,
      isRead: true,
    };

    setMessagesByPeer((prev) => ({
      ...prev,
      [currentChatPeer.id]: [
        ...(prev[currentChatPeer.id] || []),
        message,
      ],
    }));
    await storage.addMessage(currentChatPeer.id, message);

    await bleMesh.sendMessage(currentChatPeer.id, text);
  };

  const handleAttachPress = async () => {
    if (!currentChatPeer) return;
    const conn = connections.find(
      (c) => c.peerId === currentChatPeer.id,
    );
    if (!conn || conn.status !== 'connected') return;

    try {
      const supported = await fileTransfer.checkWifiP2pSupport();
      if (!supported) {
        return;
      }

      // Server is already started on app init; ensure it's running
      if (!fileTransfer.isServerRunning) {
        await fileTransfer.startServer();
      }

      // Create a WiFi Direct group so we have a network to transfer over
      await fileTransfer.createGroup();

      // Give the group time to establish
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1500));

      // Determine the peer's address for TCP file transfer
      // Priority: use the WiFi Direct group owner address if available,
      // otherwise fall back to discovery
      let peerAddress = wifiDirectPeerAddress;

      if (!peerAddress) {
        await fileTransfer.startDiscovery();
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
        peerAddress = fileTransfer.connectedPeerAddress || '192.168.49.1';
      }

      // Open document picker and send file
      await fileTransfer.selectAndSendFile(peerAddress);
    } catch (e) {
      console.error('File transfer error:', e);
    }
  };

  const handleOpenConversation = (conversation: Conversation) => {
    const conn = connections.find((c) => c.peerId === conversation.id);
    if (conn) {
      setCurrentChatPeer(connectionToScreenPeer(conn));
      setScreen('chat');
    }
  };

  const handleOpenChatCompose = () => {
    if (connections.length > 0) {
      const lastConn = connections[connections.length - 1];
      setCurrentChatPeer(connectionToScreenPeer(lastConn));
      setScreen('chat');
    } else {
      setActiveTab('nearby');
    }
  };

  const handleSaveDisplayName = async (name: string) => {
    if (userProfile) {
      const updated: StoredUserProfile = { ...userProfile, name };
      await storage.saveUserProfile(updated);
      setUserProfile(updated);
    }
  };

  const handleToggleDiscoverability = async (enabled: boolean) => {
    const updated = { discoverable: enabled };
    setSettings(updated);
    await storage.saveSettings(updated);
  };

  const handleClearLocalData = async () => {
    await storage.clearAll();
    setUserProfile(null);
    setConnections([]);
    setMessagesByPeer({});
    setFilesByPeer({});
    setSettings({ discoverable: true });
    setCurrentChatPeer(null);
    setPendingRequest(null);
    const newTalkesId = generateTalkesId();
    await storage.saveTalkesId(newTalkesId);
    setWelcomeTalkesId(newTalkesId);
    setActiveTab('home');
    setScreen('welcome');
  };

  const handleBack = () => {
    if (screen === 'chat') {
      setCurrentChatPeer(null);
    }
    if (screen === 'connectionRequest') {
      setPendingRequest(null);
    }
    setScreen('main');
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (screen !== 'main') {
      setCurrentChatPeer(null);
      setPendingRequest(null);
      setScreen('main');
    }
  };

  if (!isReady) {
    return null;
  }

  if (screen === 'welcome') {
    return (
      <FadeTransition>
        <StatusBar barStyle="dark-content" />
        <WelcomeScreen
          talkesId={welcomeTalkesId ?? ''}
          onStartMessaging={handleStartMessaging}
        />
      </FadeTransition>
    );
  }

  if (screen === 'connectionRequest' && pendingRequest) {
    return (
      <FadeTransition>
        <StatusBar barStyle="dark-content" />
        <ConnectionRequestScreen
          requesterName={pendingRequest.name}
          requesterId={pendingRequest.handle}
          requesterAvatar={pendingRequest.avatar}
          distanceLabel="Nearby • 5m away"
          securityLevel="ENCRYPTED"
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          onBack={handleBack}
          onReject={handleReject}
          onAccept={handleAccept}
        />
      </FadeTransition>
    );
  }

  if (screen === 'chat' && currentChatPeer) {
    return (
      <FadeTransition>
        <StatusBar barStyle="dark-content" />
        <ChatScreen
          peerName={currentChatPeer.name}
          peerId={currentChatPeer.handle}
          peerHandle={currentChatPeer.id}
          peerAvatar={currentChatPeer.avatar}
          isOnline={chatIsOnline}
          dateLabel={chatDateLabel}
          messages={chatMessages}
          networkStatus={chatNetworkStatus}
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          onBack={handleBack}
          onOpenMenu={() => {}}
          onSend={handleSend}
          onAttachPress={handleAttachPress}
        />
      </FadeTransition>
    );
  }

  return (
    <FadeTransition>
      <StatusBar hidden />
      {activeTab === 'home' && (
        <DashboardScreen
          userName={userProfile?.name ?? 'User'}
          userId={userTalkesId}
          userAvatar={userAvatarUri}
          isActive
          isScanning={bleMesh.isScanning}
          conversations={conversations}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenConversation={handleOpenConversation}
          onOpenChatCompose={handleOpenChatCompose}
        />
      )}
      {activeTab === 'nearby' && (
        <NearbyDiscoveryScreen
          isScanning={bleMesh.isScanning}
          radiusMeters={100}
          peers={nearbyPeers}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onConnect={handleConnect}
          onSearch={bleMesh.isScanning ? bleMesh.stopScan : bleMesh.startScan}
          onToggleAdvertising={bleMesh.isAdvertising ? bleMesh.stopAdvertising : bleMesh.startAdvertising}
          isAdvertising={bleMesh.isAdvertising}
          isPermissionGranted={bleMesh.hasPermission}
          onRequestPermissions={bleMesh.requestPermissions}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsScreen
          userAvatar={userAvatarUri}
          initialDisplayName={userProfile?.name ?? 'User'}
          initialDiscoverable={settings.discoverable}
          talkesId={userTalkesId}
          appVersion="1.2.0"
          buildNumber="294"
          protocolVersion="V4"
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onSaveDisplayName={handleSaveDisplayName}
          onToggleDiscoverability={handleToggleDiscoverability}
          onOpenLowPowerMode={() => {}}
          onClearLocalData={handleClearLocalData}
        />
      )}
    </FadeTransition>
  );
};

export default App;
