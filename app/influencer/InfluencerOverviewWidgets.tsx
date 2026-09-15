"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Copy, Send } from "lucide-react";

type ChartPoint = {
  week: string;
  commission: number;
};

function formatBdt(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} BDT`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#EADDCD] bg-white px-4 text-sm font-medium text-[#884F38] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:hover:bg-[#242220]"
    >
      <Copy aria-hidden="true" className="h-4 w-4" />
      {copied ? "Copied" : label}
    </button>
  );
}

export function ReferralCodeCard({
  referralCode,
  referralLink,
}: {
  referralCode: string;
  referralLink: string;
}) {
  const shareMessage = `\u0986\u09AE\u09BE\u09B0 referral code ${referralCode} \u09A6\u09BF\u09AF\u09BC\u09C7 Selenite Care-\u098F\u09B0 membership \u09A8\u09BF\u09A8 \u098F\u09AC\u0982 10% \u099B\u09BE\u09A1\u09BC \u09AA\u09BE\u09A8! \u{1F449} ${referralLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  return (
    <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7967] dark:text-[#8A7D75]">
            Referral Code
          </p>
          <p className="mt-3 break-all font-mono text-4xl font-bold tracking-[0.08em] text-[#D4B47A] sm:text-5xl">
            {referralCode}
          </p>
        </div>
        <CopyButton value={referralCode} label="Copy Code" />
      </div>

      <div className="mt-6 rounded-xl border border-[#EADDCD] bg-[#FCFAF7] p-4 dark:border-[#3D3530] dark:bg-[#1A1814]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7967] dark:text-[#8A7D75]">
          Referral Link
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="break-all font-mono text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
            {referralLink}
          </p>
          <CopyButton value={referralLink} label="Copy Link" />
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#B87B68] px-5 text-sm font-semibold text-[#141210] transition-colors hover:bg-[#D4B47A] sm:w-auto"
      >
        <Send aria-hidden="true" className="h-4 w-4" />
        Share on WhatsApp
      </a>
    </section>
  );
}

export function EarningsChart({ data }: { data: ChartPoint[] }) {
  return (
    <section className="rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7967] dark:text-[#8A7D75]">
          Earnings Chart
        </p>
        <h2
          className="mt-2 text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Commission earned per week
        </h2>
      </div>

      <div className="mt-6 min-w-0">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,121,103,0.25)" />
            <XAxis
              dataKey="week"
              tick={{ fill: "#8C7967", fontSize: 12 }}
              axisLine={{ stroke: "#EADDCD" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8C7967", fontSize: 12 }}
              axisLine={{ stroke: "#EADDCD" }}
              tickLine={false}
              tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
            />
            <Tooltip
              formatter={(value) => [formatBdt(Number(value)), "Commission"]}
              contentStyle={{
                borderColor: "#EADDCD",
                borderRadius: 12,
                background: "#FFFFFF",
                color: "#2B2B2B",
              }}
            />
            <Bar dataKey="commission" fill="#B87B68" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
