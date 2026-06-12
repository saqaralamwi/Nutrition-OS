import { Platform } from 'react-native';

type NetworkCallback = (isConnected: boolean) => void;

class NetworkMonitor {
  private _isConnected = true;
  private listeners = new Set<NetworkCallback>();
  private unsubscribe: (() => void) | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      this._isConnected = navigator.onLine;
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      this.unsubscribe = () => {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
      };
    } else {
      try {
        const NetInfo = await import('@react-native-community/netinfo');
        const state = await NetInfo.default.fetch();
        this._isConnected = state.isConnected ?? true;

        this.unsubscribe = NetInfo.default.addEventListener((next) => {
          const wasConnected = this._isConnected;
          this._isConnected = next.isConnected ?? true;
          if (this._isConnected && !wasConnected) {
            this.listeners.forEach((cb) => cb(true));
          }
        });
      } catch {
        this._isConnected = true;
      }
    }
  }

  private handleOnline = (): void => {
    const wasConnected = this._isConnected;
    this._isConnected = true;
    if (!wasConnected) {
      this.listeners.forEach((cb) => cb(true));
    }
  };

  private handleOffline = (): void => {
    this._isConnected = false;
    this.listeners.forEach((cb) => cb(false));
  };

  onReconnect(callback: NetworkCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  destroy(): void {
    this.unsubscribe?.();
    this.listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();
