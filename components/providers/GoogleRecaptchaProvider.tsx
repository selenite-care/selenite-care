"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function GoogleRecaptchaProvider({
  children,
  reCaptchaKey,
}: {
  children: React.ReactNode;
  reCaptchaKey?: string;
}) {
  if (!reCaptchaKey) {
    return children;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={reCaptchaKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
}
