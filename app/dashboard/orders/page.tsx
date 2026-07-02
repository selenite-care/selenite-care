"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/dateUtils";

type ClientOrder = {
  id: string;
  createdAt: string;
  totalAmount: number;
  paymentMethod: "BKASH" | "BANK_TRANSFER" | "CASH" | "STRIPE";
  status:
    | "PENDING"
    | "VERIFIED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  items: Array<{
    id: string;
    product: {
      name: string;
    };
  }>;
};

const ORDER_STATUSES = [
  "All",
  "PENDING",
  "VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
const ITEMS_PER_PAGE = 20;

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function getStatusBadgeClasses(status: ClientOrder["status"]) {
  switch (status) {
    case "PENDING":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/20 dark:text-yellow-300";
    case "VERIFIED":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300";
    case "PROCESSING":
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/20 dark:text-purple-300";
    case "SHIPPED":
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-300";
    case "DELIVERED":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300";
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300";
    default:
      return "border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5";
  }
}

function getPaymentMethodBadgeClasses(paymentMethod: ClientOrder["paymentMethod"]) {
  switch (paymentMethod) {
    case "BKASH":
      return "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900/50 dark:bg-pink-950/20 dark:text-pink-300";
    case "BANK_TRANSFER":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-300";
    case "CASH":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300";
    case "STRIPE":
      return "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-300";
    default:
      return "border-black/10 bg-zinc-50 text-foreground/70 dark:border-white/10 dark:bg-white/5";
  }
}

function getPaymentMethodLabel(paymentMethod: ClientOrder["paymentMethod"]) {
  switch (paymentMethod) {
    case "BKASH":
      return "bKash";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "CASH":
      return "Cash on Delivery";
    case "STRIPE":
      return "Card";
    default:
      return paymentMethod;
  }
}

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] =
    useState<(typeof ORDER_STATUSES)[number]>("All");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/client/orders");

        if (!response.ok) {
          throw new Error("Unable to load your orders.");
        }

        const data = (await response.json()) as { orders?: ClientOrder[] };
        setOrders(data.orders ?? []);
      } catch {
        setError("Your orders are not available right now.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrders();
  }, []);

  function formatOrderDate(value: string) {
    return formatDateTime(value);
  }

  function getProductSummary(order: ClientOrder) {
    const productNames = order.items.map((item) => item.product.name);
    const visibleNames = productNames.slice(0, 2).join(", ");
    const remainingCount = Math.max(productNames.length - 2, 0);

    if (!visibleNames) {
      return "No products";
    }

    return remainingCount > 0
      ? `${visibleNames} and ${remainingCount} more`
      : visibleNames;
  }

  const filteredOrders = useMemo(
    () =>
      statusFilter === "All"
        ? orders
        : orders.filter((order) => order.status === statusFilter),
    [orders, statusFilter],
  );
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          My Orders
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
          Track your recent product orders and payment status.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-8">
          <SkeletonTable rows={6} cols={7} />
        </div>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && orders.length === 0 ? (
        <p className="mt-8 text-sm text-[#884F38] dark:text-[#8A7D75]">
          You do not have any orders yet.
        </p>
      ) : null}

      {!isLoading && !error && orders.length > 0 ? (
        <>
          <div className="mt-8 rounded-lg border border-[#EADDCD] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220]">
            <div className="max-w-xs">
              <label
                htmlFor="order-status-filter"
                className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
              >
                Order Status
              </label>
              <select
                id="order-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as (typeof ORDER_STATUSES)[number],
                  )
                }
                className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="mt-8 text-sm text-[#884F38] dark:text-[#8A7D75]">
              No orders match your selected status.
            </p>
          ) : (
            <>
              <div className="mt-6 grid gap-4 md:hidden">
                {paginatedOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-[#EADDCD] bg-white p-5 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="break-all font-mono text-xs font-semibold text-[#B87B68]">
                        {order.id}
                      </p>
                      <span
                        className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#884F38]">
                          Date
                        </p>
                        <p className="mt-1 text-[#6E6257] dark:text-[#8A7D75]">
                          {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#884F38]">
                          Products
                        </p>
                        <p className="mt-1 text-[#2B2B2B] dark:text-[#F0EDE8]">
                          {getProductSummary(order)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                        {formatBdt(order.totalAmount)}
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getPaymentMethodBadgeClasses(
                          order.paymentMethod,
                        )}`}
                      >
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
                    >
                      View Details
                    </Link>
                  </article>
                ))}
              </div>

              <div className="bg-card border-themed mt-6 hidden overflow-hidden rounded-lg border md:block">
                <div className="overflow-x-auto">
                  <table className="table-themed w-full min-w-[920px] text-left text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 font-medium">Order ID</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Products</th>
                        <th className="px-4 py-3 font-medium">Total Amount</th>
                        <th className="px-4 py-3 font-medium">Payment Method</th>
                        <th className="px-4 py-3 font-medium">Order Status</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-4 py-4 font-mono text-xs text-[#B87B68]">
                            {order.id}
                          </td>
                          <td className="px-4 py-4 text-foreground/70">
                            {formatOrderDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-4 text-foreground/70">
                            {getProductSummary(order)}
                          </td>
                          <td className="px-4 py-4 text-foreground/70">
                            {formatBdt(order.totalAmount)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getPaymentMethodBadgeClasses(
                                order.paymentMethod,
                              )}`}
                            >
                              {getPaymentMethodLabel(order.paymentMethod)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                                order.status,
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={`/dashboard/orders/${order.id}`}
                              className="border-themed text-page inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredOrders.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          )}
        </>
      ) : null}
    </section>
  );
}
