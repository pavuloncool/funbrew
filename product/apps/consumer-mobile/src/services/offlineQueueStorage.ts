import AsyncStorage from '@react-native-async-storage/async-storage';

import type { QueueStorage } from '@funcup/shared';

/** AsyncStorage works in Expo Go; MMKV requires a dev/client build with native modules. */
export const offlineQueueStorage: QueueStorage = {
  getItem(key) {
    return AsyncStorage.getItem(key);
  },
  setItem(key, value) {
    return AsyncStorage.setItem(key, value);
  },
};
