module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest/setup.js'],
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-ble-plx|@react-native-async-storage)/)',
  ],
};
