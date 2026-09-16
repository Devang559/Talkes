export interface MeshPeer {
  id: string;
  name: string;
  handle: string;
  avatarIndex: number;
  signalColor: string;
}

export const PEER_POOL: MeshPeer[] = [];

export const PEER_WELCOME_MESSAGES: Record<string, string> = {};

const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const BLE_SERVICE_UUID = '0000feed-0000-1000-8000-00805f9b34fb';
export const BLE_MESSAGE_UUID = '0000beef-0000-1000-8000-00805f9b34fb';
export const BLE_TX_UUID = '0000cafe-0000-1000-8000-00805f9b34fb';
export const BLE_RX_UUID = '0000babe-0000-1000-8000-00805f9b34fb';
export const BLE_MANUFACTURER_ID = 0x004C;

export function encodeBlePayload(talkesId: string, name: string): string {
  const payload = JSON.stringify({ talkesId, name });
  let result = '';
  for (let i = 0; i < payload.length; i++) {
    result += payload.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return result;
}

export function decodeBlePayload(hexPayload: string): { talkesId: string; name: string } | null {
  try {
    let json = '';
    for (let i = 0; i < hexPayload.length; i += 2) {
      const code = parseInt(hexPayload.substr(i, 2), 16);
      if (!isNaN(code)) {
        json += String.fromCharCode(code);
      }
    }
    const parsed = JSON.parse(json);
    return { talkesId: parsed.talkesId, name: parsed.name };
  } catch {
    return null;
  }
}

/* eslint-disable no-bitwise */
export function encodeMessageBase64(text: string): string {  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i));
  }
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i] || 0;
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += chars[(b1 & 0xfc) >> 2];
    result += chars[((b1 & 0x03) << 4) | ((b2 & 0xf0) >> 4)];
    result += i + 1 < bytes.length ? chars[((b2 & 0x0f) << 2) | ((b3 & 0xc0) >> 6)] : '=';
    result += i + 2 < bytes.length ? chars[b3 & 0x3f] : '=';
  }
  return result;
}

/* eslint-disable no-bitwise */

export function decodeMessageBase64(base64: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup: Record<string, number> = {};
  for (let i = 0; i < chars.length; i++) {
    lookup[chars[i]] = i;
  }
  let result = '';
  for (let i = 0; i < base64.length; i += 4) {
    const b1 = lookup[base64[i]] || 0;
    const b2 = base64[i + 1] !== '=' && base64[i + 1] ? lookup[base64[i + 1]] || 0 : 0;
    const b3 = base64[i + 2] !== '=' && base64[i + 2] ? lookup[base64[i + 2]] || 0 : 0;
    const b4 = base64[i + 3] !== '=' && base64[i + 3] ? lookup[base64[i + 3]] || 0 : 0;
    result += String.fromCharCode((b1 << 2) | (b2 >> 4));
    if (base64[i + 2] !== '=') {
      result += String.fromCharCode(((b2 & 0x0f) << 4) | (b3 >> 2));
    }
    if (base64[i + 3] !== '=') {
      result += String.fromCharCode(((b3 & 0x03) << 6) | b4);
    }
  }
  return result;
}

export function chunkMessage(message: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < message.length; i += maxChunkSize) {
    chunks.push(message.slice(i, i + maxChunkSize));
  }
  return chunks;
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface BleMessagePayload {
  messageId: string;
  timestamp: number;
  text: string;
  isMine: boolean;
  chunkIndex: number;
  totalChunks: number;
  recipientId: string;
}

export function generateTalkesId(): string {
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
  }
  return `TK-${id}`;
}

export function generateDeviceId(): string {
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
  }
  return `DEV-${id}`;
}

export function getRandomSignalColor(): string {
  const signalColors = [
    '#F59E0B',
    '#22C55E',
    '#3E7BFA',
    '#A78BFA',
    '#EF4444',
    '#14B8A8',
    '#EC4899',
    '#8B5CF6',
  ];
  return signalColors[Math.floor(Math.random() * signalColors.length)];
}
