export {};

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    fbq: (
      command: string,
      event: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}
