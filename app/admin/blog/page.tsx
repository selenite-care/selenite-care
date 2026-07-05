"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/dateUtils";

type BlogPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  status: BlogPostStatus;
  publishedAt: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string | null;
  };
};

type BlogPostsResponse = {
  posts?: BlogPost[];
  error?: string;
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

function getStatusBadgeClasses(status: BlogPostStatus) {
  switch (status) {
    case "DRAFT":
      return "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-950/25 dark:text-yellow-300";
    case "PUBLISHED":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/25 dark:text-green-300";
    case "ARCHIVED":
      return "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300";
    default:
      return "border-[#EADDCD] bg-[#F8F5F0] text-[#6E6257] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]";
  }
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const filteredPostCount = useMemo(() => posts.length, [posts.length]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPosts(searchQuery, statusFilter);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  async function loadPosts(query: string, status: string) {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (query.trim()) {
        params.set("q", query.trim());
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      const response = await fetch(`/api/admin/blog?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | BlogPostsResponse
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to load blog posts.");
      }

      setPosts(data?.posts ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load blog posts.",
      );
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(post: BlogPost) {
    const confirmed = window.confirm(
      `Delete "${post.title}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingSlug(post.slug);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/blog/${post.slug}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to delete blog post.");
      }

      setSuccessMessage("Blog post deleted.");
      await loadPosts(searchQuery, statusFilter);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete blog post.",
      );
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B87B68]">
            Content
          </p>
          <h1
            className="mt-2 text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Blog Posts
          </h1>
          <p className="mt-2 text-sm text-[#6E6257] dark:text-[#8A7D75]">
            Manage drafts, published stories, and archived blog content.
          </p>
        </div>

        <Link
          href="/admin/blog/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2B2B2B] px-5 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#B87B68] dark:text-[#141210] dark:hover:bg-[#C98B78]"
        >
          <Plus className="h-4 w-4" />
          Write New Post
        </Link>
      </div>

      <div className="rounded-xl border border-[#EADDCD] bg-white p-4 dark:border-[#3D3530] dark:bg-[#242220]">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Search by title
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search blog posts..."
              className="h-11 w-full rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-4 text-sm text-[#2B2B2B] outline-none transition-colors placeholder:text-[#8C7967] focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-4 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300">
          {successMessage}
        </div>
      ) : null}

      {isLoading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-[#EADDCD] bg-white px-6 py-12 text-center dark:border-[#3D3530] dark:bg-[#242220]">
          <p className="text-base font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
            No blog posts found
          </p>
          <p className="mt-2 text-sm text-[#6E6257] dark:text-[#8A7D75]">
            Try a different search or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#242220]">
          <div className="border-b border-[#EADDCD] px-4 py-3 text-sm text-[#6E6257] dark:border-[#3D3530] dark:text-[#8A7D75]">
            Showing {filteredPostCount} blog post
            {filteredPostCount === 1 ? "" : "s"}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-[#EADDCD] text-sm text-[#2B2B2B] dark:border-[#3D3530]">
                  <th className="px-4 py-3 font-semibold">Cover</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Author</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Views</th>
                  <th className="px-4 py-3 font-semibold">Published</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADDCD] dark:divide-[#3D3530]">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-4 py-4">
                      {post.coverImage ? (
                        <div className="relative h-[50px] w-[50px] overflow-hidden rounded-md border border-[#EADDCD] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            sizes="50px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-[50px] w-[50px] items-center justify-center rounded-md border border-[#EADDCD] bg-[#F8F5F0] text-xs font-semibold text-[#8C7967] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#8A7D75]">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="max-w-[280px] px-4 py-4">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="line-clamp-2 text-sm font-semibold text-[#2B2B2B] transition-colors hover:text-[#B87B68] dark:text-[#F0EDE8] dark:hover:text-[#C98B78]"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                      {post.author.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                      {post.category || "Uncategorized"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                          post.status,
                        )}`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
                      {post.views}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#6E6257] dark:text-[#8A7D75]">
                      {formatDate(post.publishedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-[#EADDCD] px-3 text-xs font-semibold text-[#2B2B2B] transition-colors hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:border-[#B87B68]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-[#EADDCD] px-3 text-xs font-semibold text-[#2B2B2B] transition-colors hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:text-[#F0EDE8] dark:hover:border-[#B87B68]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Preview
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(post)}
                          disabled={deletingSlug === post.slug}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-red-200 px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingSlug === post.slug ? "Deleting" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
