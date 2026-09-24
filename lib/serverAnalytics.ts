import crypto from "crypto";

type FacebookCAPIEventParams = {
  eventName: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  email?: string;
  phone?: string;
  name?: string;
  sourceUrl?: string;
};

type GA4Item = {
  item_id: string;
  item_name: string;
  price: number;
  item_category: string;
  quantity: number;
};

type GA4EventParams = {
  eventName: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  items?: GA4Item[];
};

export function hashSHA256(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value.toLowerCase().trim())
    .digest("hex");
}

export async function sendFacebookCAPIEvent(
  params: FacebookCAPIEventParams,
): Promise<void> {
  try {
    const pixelId = process.env.FACEBOOK_PIXEL_ID;
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      console.error(
        "Facebook CAPI event skipped: missing FACEBOOK_PIXEL_ID or FACEBOOK_ACCESS_TOKEN.",
      );
      return;
    }

    const userData: Record<string, string[]> = {};

    if (params.email) {
      userData.em = [hashSHA256(params.email)];
    }

    if (params.phone) {
      const normalizedPhone = params.phone.replace(/\D/g, "");

      if (normalizedPhone) {
        userData.ph = [hashSHA256(normalizedPhone)];
      }
    }

    if (params.name) {
      const nameParts = params.name.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.at(-1) : undefined;

      if (firstName) {
        userData.fn = [hashSHA256(firstName)];
      }

      if (lastName) {
        userData.ln = [hashSHA256(lastName)];
      }
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(pixelId)}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [
            {
              event_name: params.eventName,
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url:
                params.sourceUrl || process.env.NEXT_PUBLIC_APP_URL,
              event_id: params.transactionId || crypto.randomUUID(),
              user_data: userData,
              custom_data: {
                value: params.value,
                currency: params.currency || "BDT",
              },
            },
          ],
          access_token: accessToken,
        }),
      },
    );

    console.info("Facebook CAPI response status:", response.status);
  } catch (error) {
    console.error("Facebook CAPI event failed:", error);
  }
}

export async function sendGA4Event(params: GA4EventParams): Promise<void> {
  try {
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
      console.error(
        "GA4 event skipped: missing GA4_MEASUREMENT_ID or GA4_API_SECRET.",
      );
      return;
    }

    const query = new URLSearchParams({
      measurement_id: measurementId,
      api_secret: apiSecret,
    });
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?${query.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: `server-${Date.now()}`,
          events: [
            {
              name: params.eventName,
              params: {
                currency: params.currency || "BDT",
                value: params.value,
                transaction_id: params.transactionId,
                items: params.items || [],
              },
            },
          ],
        }),
      },
    );

    console.info("GA4 Measurement Protocol response status:", response.status);
  } catch (error) {
    console.error("GA4 event failed:", error);
  }
}
