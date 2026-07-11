export {};

declare global {
  var gtag:
    | ((
        command: "event" | "config" | "js",
        eventNameOrDate: string | Date,
        parameters?: Record<string, unknown>,
      ) => void)
    | undefined;

  interface Window {
    dataLayer?: unknown[];
  }
}
