/* eslint-env node, jest */

const storage = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key) => storage[key] ?? null),
    setItem: jest.fn(async (key, value) => {
      storage[key] = value;
    }),
    removeItem: jest.fn(async (key) => {
      delete storage[key];
    }),
    clear: jest.fn(async () => {
      for (const key of Object.keys(storage)) {
        delete storage[key];
      }
    }),
    getAllKeys: jest.fn(async () => Object.keys(storage)),
  },
}));

jest.mock('react-native-ble-plx', () => {
  class BleManager {
    state() {
      return Promise.resolve('PoweredOn');
    }
    onStateChange(callback, emitCurrent) {
      if (emitCurrent) {
        callback('PoweredOn');
      }
      return { remove() {} };
    }
    startDeviceScan() {
      return Promise.resolve();
    }
    stopDeviceScan() {
      return Promise.resolve();
    }
    connectToDevice() {
      return Promise.resolve({
        id: 'test-device-id',
        rssi: -60,
        mtu: 23,
        name: 'TestDevice',
        connect: jest.fn(),
        cancelConnection: jest.fn(),
        discoverAllServicesAndCharacteristics: jest.fn(() => Promise.resolve()),
        requestMTU: jest.fn(() => Promise.resolve({ mtu: 23 })),
        monitorCharacteristicForService: jest.fn(),
        writeCharacteristicWithoutResponseForService: jest.fn(() => Promise.resolve()),
        onDisconnected: jest.fn(),
      });
    }
    cancelDeviceConnection() {
      return Promise.resolve();
    }
    devices() {
      return Promise.resolve([]);
    }
    connectedDevices() {
      return Promise.resolve([]);
    }
    destroy() {
      return Promise.resolve();
    }
  }

  return {
    BleManager,
    State: {
      Unknown: 'Unknown',
      Resetting: 'Resetting',
      Unsupported: 'Unsupported',
      Unauthorized: 'Unauthorized',
      PoweredOff: 'PoweredOff',
      PoweredOn: 'PoweredOn',
    },
    Device: jest.fn(),
    Subscription: jest.fn(),
  };
});

jest.mock('react-native-document-picker', () => ({
  __esModule: true,
  default: {
    pickSingle: jest.fn(() =>
      Promise.resolve({
        uri: 'file:///test/document.pdf',
        name: 'document.pdf',
        type: 'application/pdf',
        size: 1024,
      })
    ),
    isCancel: jest.fn(() => false),
    types: {
      images: 'image/*',
      video: 'video/*',
      audio: 'audio/*',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  },
}));

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  const { EventEmitter } = require('events');
  return class NativeEventEmitter extends EventEmitter {
    addListener(eventName: string, listener: (...args: any[]) => void) {
      super.addListener(eventName, listener);
      return { remove: () => this.removeListener(eventName, listener) };
    }
    removeListener() {
      return this;
    }
  };
});
