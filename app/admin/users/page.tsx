"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDateOnly } from "@/lib/dateUtils";
import { generateReferralCode } from "@/lib/referralCode";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  accounts: Array<{
    provider: string;
  }>;
  memberships: Array<{
    id: string;
    tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM";
    status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
    createdAt: string;
  }>;
  _count: {
    bookings: number;
    memberships: number;
    orders: number;
  };
};

type UserQuality = "VERIFIED" | "UNVERIFIED" | "SUSPICIOUS" | "NOT_CLIENT";
type AdminUserWithQuality = AdminUser & {
  quality: UserQuality;
};

type AdminUsersResponse = {
  users?: AdminUser[];
  totalCount?: number;
};

const ROLES = ["CLIENT", "DOCTOR", "CRM", "ADMIN"];
const ROLE_FILTERS = [
  "All",
  "CLIENT",
  "DOCTOR",
  "CRM",
  "INFLUENCER",
  "ADMIN",
] as const;
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "VERIFIED", label: "Verified" },
  { value: "UNVERIFIED", label: "Unverified" },
  { value: "SUSPICIOUS", label: "Suspicious" },
] as const;
const MEMBERSHIP_FILTERS = [
  { value: "all", label: "All" },
  { value: "none", label: "No Membership" },
  { value: "pending", label: "Pending Verification" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
] as const;
const ITEMS_PER_PAGE = 20;
const BOT_EMAIL_DOT_PATTERN = /(\w\.){2,}\w+@/;

const roleColors: Record<string, { badge: string; text: string }> = {
  CLIENT: {
    badge: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-800 dark:text-blue-300",
  },
  DOCTOR: {
    badge: "bg-purple-100 dark:bg-purple-900/20",
    text: "text-purple-800 dark:text-purple-300",
  },
  CRM: {
    badge: "bg-emerald-100 dark:bg-emerald-900/20",
    text: "text-emerald-800 dark:text-emerald-300",
  },
  INFLUENCER: {
    badge: "bg-pink-100 dark:bg-pink-900/20",
    text: "text-pink-800 dark:text-pink-300",
  },
  ADMIN: {
    badge: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-800 dark:text-red-300",
  },
};

function getMembershipStatusStyles(
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED",
) {
  switch (status) {
    case "ACTIVE":
      return {
        badge: "bg-emerald-100 dark:bg-emerald-900/20",
        text: "text-emerald-800 dark:text-emerald-300",
      };
    case "PENDING":
      return {
        badge: "bg-amber-100 dark:bg-amber-900/20",
        text: "text-amber-800 dark:text-amber-300",
      };
    case "CANCELLED":
      return {
        badge: "bg-red-100 dark:bg-red-900/20",
        text: "text-red-800 dark:text-red-300",
      };
    case "EXPIRED":
    default:
      return {
        badge: "bg-zinc-200 dark:bg-zinc-800",
        text: "text-zinc-700 dark:text-zinc-300",
      };
  }
}

function getTierLabel(tier: "SIGNATURE" | "CRYSTAL" | "PLATINUM") {
  switch (tier) {
    case "SIGNATURE":
      return "Signature";
    case "CRYSTAL":
      return "Crystal";
    case "PLATINUM":
      return "Platinum";
    default:
      return tier;
  }
}

function getPhoneDigits(phone: string | null) {
  return phone?.replace(/\D/g, "") ?? "";
}

function isBangladeshiPhone(phone: string | null) {
  const normalized = phone?.trim() ?? "";
  return normalized.startsWith("+880") || normalized.startsWith("01");
}

function looksValidPhone(phone: string | null) {
  const normalized = phone?.trim() ?? "";
  return /^[+0]/.test(normalized) && getPhoneDigits(phone).length >= 11;
}

function isTenDigitPhone(phone: string | null) {
  return /^\d{10}$/.test(phone?.trim() ?? "");
}

function hasNoVowels(name: string | null) {
  const letters = name?.replace(/[^a-z]/gi, "") ?? "";
  return letters.length > 0 && !/[aeiouAEIOU]/.test(letters);
}

function hasSuspiciousEmailDotPattern(email: string) {
  return BOT_EMAIL_DOT_PATTERN.test(email);
}

function hasGoogleAccount(user: AdminUser) {
  return user.accounts.some((account) => account.provider === "google");
}

function getUserQuality(user: AdminUser): UserQuality {
  if (user.role !== "CLIENT") {
    return "NOT_CLIENT";
  }

  if (hasGoogleAccount(user)) {
    return user.emailVerified ? "VERIFIED" : "UNVERIFIED";
  }

  const hasMembership = user._count.memberships > 0 || user.memberships.length > 0;

  if (
    user.emailVerified &&
    isBangladeshiPhone(user.phone) &&
    hasMembership
  ) {
    return "VERIFIED";
  }

  if (
    !user.emailVerified &&
    (isTenDigitPhone(user.phone) ||
      hasSuspiciousEmailDotPattern(user.email) ||
      hasNoVowels(user.name))
  ) {
    return "SUSPICIOUS";
  }

  if (!user.emailVerified && looksValidPhone(user.phone)) {
    return "UNVERIFIED";
  }

  return "UNVERIFIED";
}

function getUserQualityLabel(quality: UserQuality) {
  switch (quality) {
    case "VERIFIED":
      return "Verified";
    case "SUSPICIOUS":
      return "Suspicious";
    case "UNVERIFIED":
      return "Unverified";
    default:
      return "—";
  }
}

function getUserQualityClasses(quality: UserQuality) {
  switch (quality) {
    case "VERIFIED":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300";
    case "SUSPICIOUS":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
    case "UNVERIFIED":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300";
    default:
      return "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

function canDeleteSuspiciousUser(user: AdminUserWithQuality) {
  return (
    user.quality === "SUSPICIOUS" &&
    !user.emailVerified &&
    user._count.bookings === 0 &&
    user._count.memberships === 0 &&
    user._count.orders === 0
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<(typeof ROLE_FILTERS)[number]>("All");
  const [membershipFilter, setMembershipFilter] =
    useState<(typeof MEMBERSHIP_FILTERS)[number]["value"]>("all");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]["value"]>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDeletingSuspicious, setIsDeletingSuspicious] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [influencerUser, setInfluencerUser] =
    useState<AdminUserWithQuality | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [isMakingInfluencer, setIsMakingInfluencer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  useEffect(() => {
    async function loadUsers() {
      try {
        setError("");
        setIsLoading(true);

        const searchParams = new URLSearchParams();
        searchParams.set("page", String(currentPage));
        searchParams.set("limit", String(ITEMS_PER_PAGE));
        if (searchQuery.trim()) {
          searchParams.set("search", searchQuery.trim());
        }
        if (roleFilter !== "All") {
          searchParams.set("roleFilter", roleFilter);
        }
        if (membershipFilter !== "all") {
          searchParams.set("membershipFilter", membershipFilter);
        }

        const response = await fetch(
          `/api/admin/users${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
        );

        if (!response.ok) {
          throw new Error("Unable to load users.");
        }

        const data = (await response.json()) as AdminUsersResponse;
        setUsers(data.users ?? []);
        setTotalCount(data.totalCount ?? 0);
      } catch {
        setError("Users are not available right now.");
        setUsers([]);
        setTotalCount(0);
      } finally {
        setHasLoaded(true);
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [currentPage, membershipFilter, roleFilter, searchQuery]);

  async function handleRoleChange(userId: string, newRole: string) {
    if (updatingId) {
      return;
    }

    setUpdatingId(userId);
    setUpdateError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Failed to update user role.");
      }

      const data = (await response.json()) as { user?: AdminUser };
      if (data.user) {
        setUsers((prevUsers) =>
          prevUsers.map((user) => (user.id === userId ? data.user! : user)),
        );
      }
    } catch (err) {
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update user role.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function openInfluencerModal(user: AdminUserWithQuality) {
    const nameForCode = user.name?.trim() || user.email.split("@")[0] || "";

    setInfluencerUser(user);
    setReferralCode(generateReferralCode(nameForCode));
    setCommissionRate("10");
    setUpdateError(null);
  }

  function closeInfluencerModal() {
    if (isMakingInfluencer) {
      return;
    }

    setInfluencerUser(null);
    setReferralCode("");
    setCommissionRate("10");
  }

  async function handleMakeInfluencer() {
    if (!influencerUser || isMakingInfluencer) {
      return;
    }

    setIsMakingInfluencer(true);
    setUpdateError(null);

    try {
      const response = await fetch(
        `/api/admin/users/${influencerUser.id}/make-influencer`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            referralCode,
            commissionRate: Number(commissionRate),
          }),
        },
      );
      const data = (await response.json().catch(() => null)) as
        | { user?: AdminUser; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to make user an influencer.");
      }

      if (data?.user) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === influencerUser.id ? data.user! : user,
          ),
        );
      }

      setInfluencerUser(null);
      setReferralCode("");
      setCommissionRate("10");
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "Failed to make user an influencer.",
      );
    } finally {
      setIsMakingInfluencer(false);
    }
  }

  const usersWithQuality = useMemo<AdminUserWithQuality[]>(
    () =>
      users.map((user) => ({
        ...user,
        quality: getUserQuality(user),
      })),
    [users],
  );
  const filteredUsers = useMemo(
    () =>
      usersWithQuality.filter(
        (user) => statusFilter === "all" || user.quality === statusFilter,
      ),
    [statusFilter, usersWithQuality],
  );
  const deletableSuspiciousUsers = useMemo(
    () => usersWithQuality.filter(canDeleteSuspiciousUser),
    [usersWithQuality],
  );
  const isInitialLoading = isLoading && !hasLoaded;

  function handleExportCsv() {
    const csv = Papa.unparse(
      filteredUsers.map((user) => ({
        Name: user.name ?? "",
        Email: user.email,
        Phone: user.phone ?? "",
        Role: user.role,
        Status: getUserQualityLabel(user.quality),
        Membership: user.memberships[0]
          ? `${getTierLabel(user.memberships[0].tier)} (${user.memberships[0].status})`
          : "No Membership",
        "Registration Date": formatDateOnly(user.createdAt),
        "Total Bookings": user._count.bookings,
        "Total Orders": user._count.orders,
      })),
      {
        columns: [
          "Name",
          "Email",
          "Phone",
          "Role",
          "Status",
          "Membership",
          "Registration Date",
          "Total Bookings",
          "Total Orders",
        ],
      },
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "selenite-care-clients.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleDeleteSuspiciousUsers() {
    if (deletableSuspiciousUsers.length === 0 || isDeletingSuspicious) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${deletableSuspiciousUsers.length} suspicious unverified accounts with no activity?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingSuspicious(true);
    setUpdateError(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: deletableSuspiciousUsers.map((user) => user.id),
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { deletedCount?: number; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to delete suspicious users.");
      }

      const deletedIds = new Set(
        deletableSuspiciousUsers.map((user) => user.id),
      );
      setUsers((current) => current.filter((user) => !deletedIds.has(user.id)));
      setTotalCount((current) =>
        Math.max(0, current - (data?.deletedCount ?? deletedIds.size)),
      );
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "Failed to delete suspicious users.",
      );
    } finally {
      setIsDeletingSuspicious(false);
    }
  }

  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}>
          All Users
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
          View registered users and their booking activity.
        </p>
      </div>

      {isInitialLoading ? (
        <div className="mt-8">
          <SkeletonTable rows={6} cols={7} />
        </div>
      ) : null}

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {updateError ? (
        <p className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {updateError}
        </p>
      ) : null}

      {!isInitialLoading && !error ? (
        <>
          <div className="mt-8 rounded-lg border border-[#EADDCD] bg-white p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_180px_220px_180px_auto_auto] md:items-end">
              <div>
                <label
                  htmlFor="user-search"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Search users
                </label>
                <input
                  id="user-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Name, email, or phone number"
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#884F38] focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68]"
                />
              </div>

              <div>
                <label
                  htmlFor="role-filter"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Role
                </label>
                <select
                  id="role-filter"
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(
                      event.target.value as (typeof ROLE_FILTERS)[number],
                    );
                    setCurrentPage(1);
                  }}
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68]"
                >
                  {ROLE_FILTERS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="membership-filter"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Membership Status
                </label>
                <select
                  id="membership-filter"
                  value={membershipFilter}
                  onChange={(event) => {
                    setMembershipFilter(
                      event.target.value as (typeof MEMBERSHIP_FILTERS)[number]["value"],
                    );
                    setCurrentPage(1);
                  }}
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68]"
                >
                  {MEMBERSHIP_FILTERS.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="status-filter"
                  className="text-sm font-medium text-[#2B2B2B]"
                >
                  Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(
                      event.target
                        .value as (typeof STATUS_FILTERS)[number]["value"],
                    );
                    setCurrentPage(1);
                  }}
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68]"
                >
                  {STATUS_FILTERS.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredUsers.length === 0}
                className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: "#2B2B2B",
                  color: "#F8F5F0",
                }}
              >
                Export CSV
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteSuspiciousUsers()}
                disabled={
                  deletableSuspiciousUsers.length === 0 ||
                  isDeletingSuspicious
                }
                className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
              >
                {isDeletingSuspicious
                  ? "Deleting..."
                  : `Delete Suspicious (${deletableSuspiciousUsers.length})`}
              </button>
            </div>
            {isLoading ? (
              <p className="mt-4 text-xs text-[#884F38] dark:text-[#8A7D75]">
                Updating results...
              </p>
            ) : null}
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-themed bg-card">
            <div className="overflow-x-auto">
              <table className="table-themed w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Membership</th>
                    <th className="px-4 py-3 font-medium">Registration Date</th>
                    <th className="px-4 py-3 font-medium">Total Bookings</th>
                    <th className="px-4 py-3 font-medium">Total Orders</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="cell-muted px-4 py-8 text-center text-sm"
                      >
                        No users match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const colors = roleColors[user.role] || roleColors.CLIENT;
                      const latestMembership = user.memberships[0];
                      const membershipStyles = latestMembership
                        ? getMembershipStatusStyles(latestMembership.status)
                        : {
                            badge: "bg-zinc-200 dark:bg-zinc-800",
                            text: "text-zinc-700 dark:text-zinc-300",
                          };

                      return (
                        <tr key={user.id}>
                          <td className="px-4 py-4">{user.name ?? "Not set"}</td>
                          <td className="cell-muted px-4 py-4">{user.email}</td>
                          <td className="cell-muted px-4 py-4">
                            {user.phone ?? "Not set"}
                          </td>
                          <td className="px-4 py-4">
                            {user.role === "INFLUENCER" ? (
                              <span
                                className={`inline-flex rounded-lg px-3 py-2 text-sm font-medium ${colors.badge} ${colors.text}`}
                              >
                                INFLUENCER
                              </span>
                            ) : (
                              <select
                                value={user.role}
                                onChange={(event) =>
                                  handleRoleChange(user.id, event.target.value)
                                }
                                disabled={updatingId === user.id}
                                className={`rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors ${colors.badge} ${colors.text} disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                {ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getUserQualityClasses(
                                user.quality,
                              )}`}
                            >
                              {getUserQualityLabel(user.quality)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${membershipStyles.badge} ${membershipStyles.text}`}
                            >
                              {latestMembership
                                ? `${getTierLabel(latestMembership.tier)} • ${latestMembership.status}`
                                : "No Membership"}
                            </span>
                          </td>
                          <td className="cell-muted px-4 py-4">
                            {formatDateOnly(user.createdAt)}
                          </td>
                          <td className="cell-muted px-4 py-4">
                            {user._count.bookings}
                          </td>
                          <td className="cell-muted px-4 py-4">
                            {user._count.orders}
                          </td>
                          <td className="px-4 py-4">
                            {user.role === "CLIENT" ? (
                              <button
                                type="button"
                                onClick={() => openInfluencerModal(user)}
                                disabled={
                                  updatingId === user.id || isMakingInfluencer
                                }
                                className="inline-flex h-9 items-center justify-center rounded-md border border-[#B87B68] px-3 text-xs font-semibold text-[#884F38] transition-colors hover:bg-[#F8F5F0] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#8A7D75] dark:text-[#F0EDE8] dark:hover:bg-[#242220]"
                              >
                                Make Influencer
                              </button>
                            ) : (
                              <span className="text-xs text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="px-4 pb-4 text-xs text-muted md:hidden">
              Scroll to see more
            </p>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalCount}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      ) : null}

      {influencerUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleMakeInfluencer();
            }}
            className="w-full max-w-md rounded-lg border border-[#EADDCD] bg-white p-6 shadow-xl dark:border-[#3D3530] dark:bg-[#242220]"
          >
            <h2 className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Assign Influencer Role to {influencerUser.name ?? "this user"}
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="referral-code"
                  className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Referral Code
                </label>
                <input
                  id="referral-code"
                  type="text"
                  value={referralCode}
                  onChange={(event) =>
                    setReferralCode(event.target.value.toUpperCase())
                  }
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm font-semibold uppercase tracking-wide text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="commission-rate"
                  className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  Commission Rate (%)
                </label>
                <input
                  id="commission-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={commissionRate}
                  onChange={(event) => setCommissionRate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-[#EADDCD] bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeInfluencerModal}
                disabled={isMakingInfluencer}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#EADDCD] px-4 text-sm font-medium text-[#884F38] transition-colors hover:bg-[#F8F5F0] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#1A1814]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isMakingInfluencer}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F0EDE8] dark:text-[#1A1814]"
              >
                {isMakingInfluencer ? "Assigning..." : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
