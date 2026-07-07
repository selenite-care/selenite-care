const IN_APP_BROWSER_PATTERNS = [
  "FBAN",
  "FBAV",
  "FB_IAB",
  "Instagram",
  "Musical_ly",
  "TikTok",
  "Twitter",
  "Line/",
  "KAKAOTALK",
  "WhatsApp",
  "Snapchat",
  "Pinterest",
  "GSA",
] as const;

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;

  if (!userAgent) {
    return false;
  }

  const isAndroidWebView =
    userAgent.includes("Android") && userAgent.includes("wv");

  return (
    isAndroidWebView ||
    IN_APP_BROWSER_PATTERNS.some((pattern) => userAgent.includes(pattern))
  );
}
