"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  ShoppingBag,
  User,
} from "lucide-react";
import MessagesBadge from "@/components/ui/MessagesBadge";

type QuickActionsProps = {
  appointmentHref: string;
};

const actionCardClasses =
  "group flex items-center justify-between gap-4 rounded-2xl border border-[#EADDCD] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#B87B68]/70 hover:shadow-[0_16px_35px_rgba(184,123,104,0.16)] dark:border-[#3D3530] dark:bg-[#242220] dark:hover:border-[#B87B68]/70";

const iconWrapClasses =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B87B68]/15 text-[#B87B68] transition-colors group-hover:bg-[#B87B68] group-hover:text-[#F8F5F0] dark:bg-[#D4B47A]/15 dark:text-[#D4B47A] dark:group-hover:bg-[#D4B47A] dark:group-hover:text-[#141210]";

export default function QuickActions({ appointmentHref }: QuickActionsProps) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href={appointmentHref} className={actionCardClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <span className={iconWrapClasses}>
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Book Appointment
            </span>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#B87B68] transition-transform group-hover:translate-x-1 dark:text-[#D4B47A]" />
        </Link>

        <Link href="/products" className={actionCardClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <span className={iconWrapClasses}>
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Shop Products
            </span>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#B87B68] transition-transform group-hover:translate-x-1 dark:text-[#D4B47A]" />
        </Link>

        <Link href="/dashboard/messages" className={actionCardClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <span className={iconWrapClasses}>
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              My Messages
            </span>
            <MessagesBadge />
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#B87B68] transition-transform group-hover:translate-x-1 dark:text-[#D4B47A]" />
        </Link>

        <Link href="/dashboard/survey" className={actionCardClasses}>
          <div className="flex min-w-0 items-center gap-3">
            <span className={iconWrapClasses}>
              <User className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="truncate text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              My Skin Profile
            </span>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[#B87B68] transition-transform group-hover:translate-x-1 dark:text-[#D4B47A]" />
        </Link>
      </div>
    </div>
  );
}
