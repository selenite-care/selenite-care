"use client";

import Image from "next/image";
import Link from "next/link";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

type AdminOrder = {
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
  transactionRef: string | null;
  proofImageUrl: string | null;
  user: {
    name: string | null;
    phone: string | null;
    email: string;
  };
  _count: {
    items: number;
  };
};

const ORDER_STATUS_OPTIONS: AdminOrder["status"][] = [
  "PENDING",
  "VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function formatBdt(amount: number) {
  return `${Math.round(amount)} BDT`;
}

function getStatusBadgeClasses(status: AdminOrder["status"]) {
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

function getPaymentMethodBadgeClasses(paymentMethod: AdminOrder["paymentMethod"]) {
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

function getPaymentMethodLabel(paymentMethod: AdminOrder["paymentMethod"]) {
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/admin/orders", {
          cache: "no-store",
        });

        const data = (await response.json().catch(() => null)) as
          | { orders?: AdminOrder[]; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to load orders.");
        }

        setOrders(data?.orders ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load orders.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const clientName = order.user.name ?? order.user.email;
      const matchesQuery =
        !normalizedQuery ||
        order.id.toLowerCase().includes(normalizedQuery) ||
        clientName.toLowerCase().includes(normalizedQuery) ||
        order.user.email.toLowerCase().includes(normalizedQuery) ||
        (order.user.phone ?? "").toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  async function handleStatusUpdate(orderId: string, status: AdminOrder["status"]) {
    setUpdatingOrderId(orderId);
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; order?: { id: string; status: AdminOrder["status"] } }
        | null;

      if (!response.ok || !data?.order) {
        throw new Error(data?.error ?? "Unable to update order status.");
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: data.order!.status } : order,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update order status.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredOrders.map((order) => ({
        "Order ID": order.id,
        "Client Name": order.user.name ?? order.user.email,
        "Client Phone": order.user.phone ?? "",
        "Client Email": order.user.email,
        "Items Count": order._count.items,
        "Total Amount": formatBdt(order.totalAmount),
        "Payment Method": getPaymentMethodLabel(order.paymentMethod),
        "Transaction Reference": order.transactionRef ?? "",
        Status: order.status,
        Date: new Date(order.createdAt).toLocaleString(),
      })),
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selenite-care-orders.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Orders
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#B8A89A] dark:text-[#8A7D75]">
          Review product orders, payment proofs, and fulfillment progress.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
          Loading orders...
        </p>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error ? (
        <>
          <div className="mt-8 rounded-lg border border-[#D8C7B5] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220]">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-end">
              <div>
                <label
                  htmlFor="orders-search"
                  className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Search Orders
                </label>
                <input
                  id="orders-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Order ID or client name"
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#B8A89A] focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8] dark:placeholder-[#8A7D75]"
                />
              </div>

              <div>
                <label
                  htmlFor="orders-status-filter"
                  className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Status
                </label>
                <select
                  id="orders-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                >
                  <option value="ALL">All Statuses</option>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredOrders.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#C6A56B] dark:text-[#141210] dark:hover:bg-[#D4B47A]"
              >
                Export CSV
              </button>
            </div>

            <p className="mt-4 text-sm text-[#B8A89A] dark:text-[#8A7D75]">
              Showing {filteredOrders.length} of {orders.length} orders.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-themed bg-card">
            <div className="overflow-x-auto">
              <table className="table-themed w-full min-w-[1320px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">Order ID</th>
                    <th className="px-4 py-3 font-medium">Client Name</th>
                    <th className="px-4 py-3 font-medium">Client Phone</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total Amount</th>
                    <th className="px-4 py-3 font-medium">Payment Method</th>
                    <th className="px-4 py-3 font-medium">Proof</th>
                    <th className="px-4 py-3 font-medium">Transaction Ref</th>
                    <th className="px-4 py-3 font-medium">Order Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="cell-muted px-4 py-8 text-center text-sm">
                        No orders match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="cell-muted px-4 py-4 font-mono text-xs">
                          {order.id}
                        </td>
                        <td className="px-4 py-4">
                          {order.user.name ?? order.user.email}
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {order.user.phone ?? "Not provided"}
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {order._count.items}
                        </td>
                        <td className="cell-muted px-4 py-4">
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
                          {order.proofImageUrl ? (
                            <a
                              href={order.proofImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="relative block h-14 w-14 overflow-hidden rounded-md border border-[#D8C7B5] dark:border-[#3D3530]"
                            >
                              <Image
                                src={order.proofImageUrl}
                                alt={`Payment proof for order ${order.id}`}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </a>
                          ) : (
                            <span className="text-xs text-[#B8A89A] dark:text-[#8A7D75]">
                              None
                            </span>
                          )}
                        </td>
                        <td className="cell-muted px-4 py-4">
                          {order.transactionRef ?? "Not provided"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex min-w-[170px] flex-col gap-3">
                            <span
                              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadgeClasses(
                                order.status,
                              )}`}
                            >
                              {order.status}
                            </span>
                            <select
                              value={order.status}
                              disabled={updatingOrderId === order.id}
                              onChange={(event) =>
                                void handleStatusUpdate(
                                  order.id,
                                  event.target.value as AdminOrder["status"],
                                )
                              }
                              className="h-10 rounded-md border border-[#D8C7B5] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                            >
                              {ORDER_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="border-themed text-page inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="px-4 pb-4 text-xs text-muted md:hidden">
              Scroll to see more
            </p>
          </div>
        </>
      ) : null}
    </section>
  );
}
