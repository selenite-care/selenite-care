import { EPS, generateTransactionId } from "eps-gateway-nodejs";

export function getEPSClient() {
  if (
    !process.env.EPS_USERNAME ||
    !process.env.EPS_PASSWORD ||
    !process.env.EPS_HASH_KEY ||
    !process.env.EPS_MERCHANT_ID ||
    !process.env.EPS_STORE_ID
  ) {
    throw new Error("EPS environment variables are not configured");
  }

  return new EPS({
    username: process.env.EPS_USERNAME,
    password: process.env.EPS_PASSWORD,
    hashKey: process.env.EPS_HASH_KEY,
    merchantId: process.env.EPS_MERCHANT_ID,
    storeId: process.env.EPS_STORE_ID,
    sandbox: process.env.EPS_SANDBOX === "true",
  });
}

export function getEPSCallbackUrls(type: "membership" | "order", id: string) {
  void id;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, "");

  return {
    successUrl: `${baseUrl}/api/eps/${type}/success`,
    failUrl: `${baseUrl}/api/eps/${type}/fail`,
    cancelUrl: `${baseUrl}/api/eps/${type}/cancel`,
  };
}

export { generateTransactionId };
