type Listener = (isConnected: boolean) => void;

class NetworkMonitor {
  private _isConnected = true;
  private listeners = new Set<Listener>();
  private unsubscribe: (() => void) | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async initialize(): Promise<void> {
    try {
      const NetInfo = await import('@react-native-community/netinfo');
      const state = await NetInfo.default.fetch();
      this._isConnected = state.isConnected ?? true;

      this.unsubscribe = NetInfo.default.addEventListener((next: any) => {
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

  onReconnect(callback: Listener): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  destroy(): void {
    this.unsubscribe?.();
    this.listeners.clear();
  }
}

export const networkMonitor = new NetworkMonitor();
