import crypto from "crypto";

const SANDBOX_BASE = "https://sandboxpgapi.eps.com.bd";
const LIVE_BASE = "https://pgapi.eps.com.bd";

function getBaseUrl(): string {
  return process.env.EPS_SANDBOX === "true" ? SANDBOX_BASE : LIVE_BASE;
}

function generateHash(data: string, hashKey: string): string {
  return crypto.createHmac("sha512", hashKey).update(data).digest("base64");
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${timestamp}${random}`;
}

export function getEPSCallbackUrls(type: "membership" | "order", id: string) {
  void id;

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  return {
    successUrl: `${base}/api/eps/${type}/success`,
    failUrl: `${base}/api/eps/${type}/fail`,
    cancelUrl: `${base}/api/eps/${type}/cancel`,
  };
}

async function getEPSToken(): Promise<string> {
  const hashKey = process.env.EPS_HASH_KEY!;
  const userName = process.env.EPS_USERNAME!;
  const password = process.env.EPS_PASSWORD!;

  const hashData = `${userName}${password}`;
  const xHash = generateHash(hashData, hashKey);

  const response = await fetch(`${getBaseUrl()}/v1/Auth/GetToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hash": xHash,
    },
    body: JSON.stringify({ userName, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EPS GetToken failed: ${response.status} - ${text}`);
  }

  const data = await response.json();

  if (!data.token && !data.Token && !data.access_token && !data.accessToken) {
    throw new Error(`EPS GetToken returned no token: ${JSON.stringify(data)}`);
  }

  return data.token || data.Token || data.access_token || data.accessToken;
}

export async function initializeEPSPayment(params: {
  merchantTransactionId: string;
  customerOrderId: string;
  totalAmount: number;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  productName: string;
  valueA?: string;
  valueB?: string;
  productList?: Array<{
    ProductName: string;
    NoOfItem: string;
    ProductProfile: string;
    ProductCategory: string;
    ProductPrice: string;
  }>;
}) {
  const token = await getEPSToken();
  const hashKey = process.env.EPS_HASH_KEY!;
  const storeId = process.env.EPS_STORE_ID!;

  const hashData = `${storeId}${params.merchantTransactionId}${params.totalAmount}`;
  const xHash = generateHash(hashData, hashKey);

  const body = {
    storeId,
    merchantTransactionId: params.merchantTransactionId,
    CustomerOrderId: params.customerOrderId,
    transactionTypeId: 10,
    financialEntityId: 0,
    transitionStatusId: 0,
    totalAmount: params.totalAmount,
    ipAddress: "127.0.0.1",
    version: "1.0",
    successUrl: params.successUrl,
    failUrl: params.failUrl,
    cancelUrl: params.cancelUrl,
    customerName: params.customerName || "Customer",
    customerEmail: params.customerEmail || "",
    customerAddress: params.customerAddress || "Dhaka",
    customerAddress2: "",
    customerCity: "Dhaka",
    customerState: "Dhaka",
    customerPostcode: "1200",
    customerCountry: "Bangladesh",
    customerPhone: params.customerPhone || "01000000000",
    shipmentName: params.customerName || "Customer",
    shipmentAddress: params.customerAddress || "Dhaka",
    shipmentAddress2: "",
    shipmentCity: "Dhaka",
    shipmentState: "Dhaka",
    shipmentPostcode: "1200",
    shipmentCountry: "Bangladesh",
    valueA: params.valueA || "",
    valueB: params.valueB || "",
    valueC: "",
    valueD: "",
    shippingMethod: "NO",
    noOfItem: params.productList ? params.productList.length.toString() : "1",
    productName: params.productName,
    productProfile: "general",
    productCategory: "Service",
    ProductList: params.productList || [
      {
        ProductName: params.productName,
        NoOfItem: "1",
        ProductProfile: "general",
        ProductCategory: "Service",
        ProductPrice: params.totalAmount.toString(),
      },
    ],
  };

  const response = await fetch(`${getBaseUrl()}/v1/EPSEngine/InitializeEPS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-hash": xHash,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EPS InitializeEPS failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  console.log("EPS Initialize response:", JSON.stringify(data));

  const redirectUrl =
    data.redirectUrl ||
    data.RedirectUrl ||
    data.RedirectURL ||
    data.redirect_url ||
    data.GatewayUrl ||
    data.gatewayUrl ||
    data.paymentUrl;

  if (!redirectUrl) {
    throw new Error(`EPS returned no redirect URL: ${JSON.stringify(data)}`);
  }

  return { redirectUrl, data };
}

export async function verifyEPSPayment(merchantTransactionId: string) {
  const token = await getEPSToken();
  const hashKey = process.env.EPS_HASH_KEY!;
  const storeId = process.env.EPS_STORE_ID!;

  const hashData = `${storeId}${merchantTransactionId}`;
  const xHash = generateHash(hashData, hashKey);

  const url = `${getBaseUrl()}/v1/EPSEngine/CheckMerchantTransactionStatus?merchantTransactionId=${encodeURIComponent(
    merchantTransactionId,
  )}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-hash": xHash,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EPS CheckStatus failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  console.log("EPS verify response:", JSON.stringify(data));
  return data;
}
