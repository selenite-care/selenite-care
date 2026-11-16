import { GET as handleMembershipSuccess } from "@/app/api/eps/membership/success/route";
import { GET as handleOrderSuccess } from "@/app/api/eps/order/success/route";
import { GET as handleConsultationSuccess } from "@/app/api/one-time-consultation/success/route";
import { GET as handleSkinAnalysisPurchaseSuccess } from "@/app/api/skin-analysis/purchase/success/route";

export type EPSRecheckType =
  | "membership"
  | "order"
  | "consultation"
  | "skin-analysis";

export async function applyEPSPaymentSuccess(
  type: EPSRecheckType,
  merchantTransactionId: string,
  origin: string,
) {
  const pathByType: Record<EPSRecheckType, string> = {
    membership: "/api/eps/membership/success",
    order: "/api/eps/order/success",
    consultation: "/api/one-time-consultation/success",
    "skin-analysis": "/api/skin-analysis/purchase/success",
  };
  const url = new URL(pathByType[type], origin);
  url.searchParams.set("merchantTransactionId", merchantTransactionId);
  const request = new Request(url, {
    method: "GET",
    headers: {
      "x-eps-recheck": "true",
    },
  });

  switch (type) {
    case "membership":
      return handleMembershipSuccess(request);
    case "order":
      return handleOrderSuccess(request);
    case "consultation":
      return handleConsultationSuccess(request);
    case "skin-analysis":
      return handleSkinAnalysisPurchaseSuccess(request);
  }
}
