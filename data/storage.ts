import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredUserProfile {
  name: string;
  talkesId: string;
  avatarIndex: number;
}

export interface StoredConnection {
  peerId: string;
  peerName: string;
  peerHandle: string;
  peerAvatar: string;
  peerSignalColor: string;
  status: 'connected' | 'disconnected';
  updatedAt: number;
}

export interface StoredMessage {
  id: string;
  text: string;
  timestamp: number;
  isMine: boolean;
  isRead: boolean;
}

export interface StoredSettings {
  discoverable: boolean;
}

const KEYS = {
  USER_PROFILE: 'talkes:user_profile',
  CONNECTIONS: 'talkes:connections',
  MESSAGES: 'talkes:messages',
  SETTINGS: 'talkes:settings',
  DEVICE_ID: 'talkes:device_id',
  TALKES_ID: 'talkes:talkes_id',
} as const;

export const storage = {
  async getUserProfile(): Promise<StoredUserProfile | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  },

  async saveUserProfile(profile: StoredUserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  async getConnections(): Promise<StoredConnection[]> {
    const raw = await AsyncStorage.getItem(KEYS.CONNECTIONS);
    return raw ? JSON.parse(raw) : [];
  },

  async saveConnections(connections: StoredConnection[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CONNECTIONS, JSON.stringify(connections));
  },

  async addConnection(connection: StoredConnection): Promise<StoredConnection[]> {
    const connections = await this.getConnections();
    const filtered = connections.filter((c) => c.peerId !== connection.peerId);
    filtered.push(connection);
    await this.saveConnections(filtered);
    return filtered;
  },

  async getMessages(): Promise<Record<string, StoredMessage[]>> {
    const raw = await AsyncStorage.getItem(KEYS.MESSAGES);
    return raw ? JSON.parse(raw) : {};
  },

  async saveMessages(messages: Record<string, StoredMessage[]>): Promise<void> {
    await AsyncStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
  },

  async addMessage(peerId: string, message: StoredMessage): Promise<void> {
    const allMessages = await this.getMessages();
    const peerMessages = allMessages[peerId] || [];
    peerMessages.push(message);
    allMessages[peerId] = peerMessages;
    await this.saveMessages(allMessages);
  },

  async getSettings(): Promise<StoredSettings> {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : { discoverable: true };
  },

  async saveSettings(settings: StoredSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  async getDeviceId(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.DEVICE_ID);
  },

  async saveDeviceId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.DEVICE_ID, id);
  },

  async getStoredTalkesId(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.TALKES_ID);
  },

  async saveTalkesId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.TALKES_ID, id);
  },

  async clearAll(): Promise<void> {
    const talkesId = await this.getStoredTalkesId();
    await AsyncStorage.clear();
    if (talkesId) {
      await this.saveTalkesId(talkesId);
    }
  },
};

export default storage;
