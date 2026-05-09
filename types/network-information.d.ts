interface NetworkInformation {
  readonly effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  readonly saveData: boolean;
  readonly downlink: number;
  readonly rtt: number;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

declare global {
  interface Navigator {
    readonly connection?: NetworkInformation;
  }

  interface WorkerNavigator {
    readonly connection?: NetworkInformation;
  }
}

export {};
