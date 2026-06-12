import { Platform } from 'react-native';

export const IS_WEB = Platform.OS === 'web';
export const IS_NATIVE = Platform.OS === 'android' || Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

export function isWeb(): boolean {
  return Platform.OS === 'web';
}

export function isNative(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}
