type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type CartItem = Product & {
  quantity: number;
};

const CURRENCY = "BDT";
const MEMBERSHIP_CATEGORY = "Membership";

function toGa4Item(item: CartItem) {
  return {
    item_id: item.id,
    item_name: item.name,
    price: item.price,
    item_category: item.category,
    quantity: item.quantity,
  };
}

function pushToDataLayer(payload: Record<string, unknown>) {
  try {
    if (
      typeof window !== "undefined" &&
      typeof window.dataLayer !== "undefined"
    ) {
      window.dataLayer.push(payload);
    }
  } catch {
    // Analytics must never interrupt the customer journey.
  }
}

function trackMeta(eventName: string, parameters: Record<string, unknown>) {
  try {
    if (typeof window !== "undefined" && typeof window.fbq !== "undefined") {
      window.fbq("track", eventName, parameters);
    }
  } catch {
    // Analytics must never interrupt the customer journey.
  }
}

function getMembershipItem(tier: string, price: number): CartItem {
  return {
    id: `membership_${tier.toLowerCase()}`,
    name: `${tier} Membership`,
    price,
    category: MEMBERSHIP_CATEGORY,
    quantity: 1,
  };
}

export function trackViewItem(product: Product) {
  try {
    const item = { ...product, quantity: 1 };

    pushToDataLayer({
      event: "view_item",
      ecommerce: {
        currency: CURRENCY,
        value: product.price,
        items: [toGa4Item(item)],
      },
    });

    trackMeta("ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      content_type: "product",
      value: product.price,
      currency: CURRENCY,
    });
  } catch {
    // Analytics must never interrupt the customer journey.
  }
}

export function trackAddToCart(product: CartItem) {
  try {
    const value = product.price * product.quantity;

    pushToDataLayer({
      event: "add_to_cart",
      ecommerce: {
        currency: CURRENCY,
        value,
        items: [toGa4Item(product)],
      },
    });

    trackMeta("AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      content_type: "product",
      contents: [{ id: product.id, quantity: product.quantity }],
      value,
      currency: CURRENCY,
    });
  } catch {
    // Analytics must never interrupt the customer journey.
  }
}

export function trackBeginCheckout(items: CartItem[], totalValue: number) {
  try {
    pushToDataLayer({
      event: "begin_checkout",
      ecommerce: {
        currency: CURRENCY,
        value: totalValue,
        items: items.map(toGa4Item),
      },
    });

    trackMeta("InitiateCheckout", {
      content_ids: items.map((item) => item.id),
      content_type: "product",
      contents: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
      num_items: items.reduce((total, item) => total + item.quantity, 0),
      value: totalValue,
      currency: CURRENCY,
    });
  } catch {
    // Analytics must never interrupt the customer journey.
  }
}

export function trackPurchase(
  transactionId: string,
  items: CartItem[],
  totalValue: number,
) {
  try {
    pushToDataLayer({
      event: "purchase",
      ecommerce: {
        transaction_id: transactionId,
        currency: CURRENCY,
        value: totalValue,
        items: items.map(toGa4Item),
      },
    });

    trackMeta("Purchase", {
      content_ids: items.map((item) => item.id),
      content_type: "product",
      contents: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      })),
      num_items: items.reduce((total, item) => total + item.quantity, 0),
      value: totalValue,
      currency: CURRENCY,
    });
  } catch {
    // Analytics must never interrupt the customer journey.
  }
}

export function trackViewMembership(tier: string, price: number) {
  try {
    const item = getMembershipItem(tier, price);

    pushToDataLayer({
      event: "view_item",
      ecommerce: {
        currency: CURRENCY,
        value: price,
        items: [toGa4Item(item)],
      },
    });

    trackMeta("ViewContent", {
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category,
      content_type: "product",
      value: price,
      currency: CURRENCY,
    });
  } catch {
    // Analytics must never interrupt the customer journey.
  }
}

export function trackMembershipCheckout(tier: string, price: number) {
  try {
    const item = getMembershipItem(tier, price);

    pushToDataLayer({
      event: "begin_checkout",
      ecommerce: {
        currency: CURRENCY,
        value: price,
        items: [toGa4Item(item)],
      },
    });

    trackMeta("InitiateCheckout", {
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category,
      content_type: "product",
      contents: [{ id: item.id, quantity: 1 }],
      num_items: 1,
      value: price,
      currency: CURRENCY,
    });
  } catch {
    // Analytics must never interrupt the customer journey.
  }
}

export function trackMembershipPurchase(
  transactionId: string,
  tier: string,
  price: number,
) {
  try {
    const item = getMembershipItem(tier, price);

    pushToDataLayer({
      event: "purchase",
      ecommerce: {
        transaction_id: transactionId,
        currency: CURRENCY,
        value: price,
        items: [toGa4Item(item)],
      },
    });

    trackMeta("Purchase", {
      content_ids: [item.id],
      content_name: item.name,
      content_category: item.category,
      content_type: "product",
      contents: [{ id: item.id, quantity: 1 }],
      num_items: 1,
      value: price,
      currency: CURRENCY,
    });
  } catch {
    // Analytics must never interrupt the customer journey.
  }
}
