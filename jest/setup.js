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
