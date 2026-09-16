import { Image } from 'react-native';

const avatarSources = [
  require('../assets/avatars/avatar1.png'),
  require('../assets/avatars/avatar2.png'),
  require('../assets/avatars/avatar3.png'),
  require('../assets/avatars/avatar4.png'),
  require('../assets/avatars/avatar5.png'),
  require('../assets/avatars/avatar6.png'),
  require('../assets/avatars/avatar7.png'),
  require('../assets/avatars/avatar8.png'),
];

export const AVATAR_COUNT = avatarSources.length;

export function getAvatarUri(index: number): string {
  const source = Image.resolveAssetSource(
    avatarSources[index % avatarSources.length],
  );
  return source?.uri ?? '';
}

export function getAvatarIndexForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.floor(hash * 31 + id.charCodeAt(i));
  }
  return Math.abs(hash) % AVATAR_COUNT;
}

export function getAvatarUriForId(id: string): string {
  return getAvatarUri(getAvatarIndexForId(id));
}
