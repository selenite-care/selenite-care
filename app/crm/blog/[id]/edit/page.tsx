"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ExternalLink, ImagePlus, Loader2, X } from "lucide-react";
import BlogEditor from "@/components/blog/BlogEditor";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/dateUtils";
import { slugify } from "@/lib/slugify";

type BlogPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type SaveStatus = "idle" | "saving" | "saved" | "error";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  status: BlogPostStatus;
  publishedAt: string | null;
  updatedAt: string;
  author: {
    name: string | null;
    avatar?: string | null;
  };
};

type BlogPostResponse = {
  post?: BlogPost;
  canEdit?: boolean;
  error?: string;
};

const AUTOSAVE_INTERVAL_MS = 60_000;

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

export default function EditCrmBlogPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = params.id;
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [currentSlug, setCurrentSlug] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<BlogPostStatus>("DRAFT");
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  const normalizedSlug = useMemo(() => slugify(slug) || "post-title", [slug]);
  const canSave =
    canEdit && title.trim().length > 0 && content.trim().length > 0 && !!currentSlug;

  useEffect(() => {
    let isMounted = true;

    async function loadPost() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/crm/blog/${postId}`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | BlogPostResponse
          | null;

        if (!response.ok || !data?.post) {
          throw new Error(data?.error ?? "Unable to load blog post.");
        }

        if (!isMounted) {
          return;
        }

        setCanEdit(data.canEdit === true);
        setTitle(data.post.title);
        setSlug(data.post.slug);
        setCurrentSlug(data.post.slug);
        setContent(data.post.content);
        setCoverImage(data.post.coverImage ?? "");
        setCategory(data.post.category ?? "");
        setTags(data.post.tags);
        setExcerpt(data.post.excerpt ?? "");
        setStatus(data.post.status);
        setAuthorName(data.post.author.name);
        setLastSavedAt(data.post.updatedAt);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : "Unable to load blog post.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPost();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!canSave || saveStatus === "saving") {
        return;
      }

      void savePost(status, { isAutoSave: true });
    }, AUTOSAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [
    canSave,
    saveStatus,
    status,
    title,
    content,
    coverImage,
    category,
    tags,
    excerpt,
    normalizedSlug,
    currentSlug,
  ]);

  async function uploadCoverImage(file: File) {
    if (!canEdit) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSaveStatus("error");
      setSaveMessage("Please upload an image file.");
      return;
    }

    setIsUploadingCover(true);
    setSaveMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as
        | { secure_url?: string; url?: string; error?: string }
        | null;
      const imageUrl = data?.secure_url ?? data?.url ?? "";

      if (!response.ok || !imageUrl) {
        throw new Error(data?.error ?? "Unable to upload cover image.");
      }

      setCoverImage(imageUrl);
      setSaveStatus("idle");
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(
        error instanceof Error ? error.message : "Unable to upload cover image.",
      );
    } finally {
      setIsUploadingCover(false);
    }
  }

  function handleCoverInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      void uploadCoverImage(file);
    }
  }

  function handleCoverDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDraggingCover(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void uploadCoverImage(file);
    }
  }

  function addTag(rawTag: string) {
    const nextTag = rawTag.trim();

    if (!nextTag || !canEdit) {
      return;
    }

    setTags((currentTags) =>
      currentTags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())
        ? currentTags
        : [...currentTags, nextTag],
    );
    setTagInput("");
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addTag(tagInput);
  }

  async function savePost(
    nextStatus: BlogPostStatus,
    options: { isAutoSave?: boolean } = {},
  ) {
    if (!canSave) {
      setSaveStatus("error");
      setSaveMessage(
        canEdit
          ? "Title and body are required before saving."
          : "This post was written by another team member.",
      );
      return null;
    }

    setSaveStatus("saving");
    setSaveMessage(options.isAutoSave ? "Auto-saving..." : "Saving...");

    try {
      const response = await fetch(`/api/crm/blog/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: normalizedSlug,
          content,
          excerpt: excerpt.trim(),
          coverImage,
          category: category.trim(),
          tags,
          status: nextStatus,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | BlogPostResponse
        | null;

      if (!response.ok || !data?.post) {
        throw new Error(data?.error ?? "Unable to save blog post.");
      }

      setSlug(data.post.slug);
      setCurrentSlug(data.post.slug);
      setStatus(data.post.status);
      setLastSavedAt(data.post.updatedAt);
      setSaveStatus("saved");
      setSaveMessage(
        options.isAutoSave
          ? `Auto-saved at ${new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}`
          : "Saved.",
      );

      return data.post;
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(
        error instanceof Error ? error.message : "Unable to save blog post.",
      );
      return null;
    }
  }

  async function handleSaveDraft() {
    await savePost("DRAFT");
  }

  async function handlePublishToggle() {
    await savePost(status === "PUBLISHED" ? "DRAFT" : "PUBLISHED");
  }

  async function handleArchive() {
    const post = await savePost("ARCHIVED");

    if (post) {
      router.refresh();
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
        {loadError}
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-[#EADDCD] bg-white p-5 dark:border-[#3D3530] dark:bg-[#242220]">
          <p className="text-sm font-semibold text-[#B87B68]">
            This post was written by another team member
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1
              className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {title}
            </h1>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                status,
              )}`}
            >
              {status}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#8C7967] dark:text-[#8A7D75]">
            Author: {authorName ?? "Unknown"} | Last saved:{" "}
            {lastSavedAt ? formatDateTime(lastSavedAt) : "N/A"}
          </p>
          <Link
            href={`/blog/${currentSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#EADDCD] px-4 text-sm font-semibold text-[#2B2B2B] transition-colors hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:text-[#F0EDE8]"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </Link>
        </div>

        {coverImage ? (
          <div className="relative aspect-[21/9] overflow-hidden rounded-xl border border-[#EADDCD] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]">
            <Image
              src={coverImage}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        ) : null}

        <article className="rounded-xl border border-[#EADDCD] bg-white p-6 dark:border-[#3D3530] dark:bg-[#242220]">
          {category ? (
            <p className="text-sm font-semibold text-[#B87B68]">{category}</p>
          ) : null}
          {excerpt ? (
            <p className="mt-3 text-base leading-7 text-[#6E6257] dark:text-[#8A7D75]">
              {excerpt}
            </p>
          ) : null}
          {tags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#B87B68]/15 px-3 py-1 text-xs font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div
            className="mt-6 max-w-none text-[#2B2B2B] dark:text-[#F0EDE8] [&_a]:text-[#B87B68] [&_blockquote]:border-l-4 [&_blockquote]:border-[#B87B68] [&_blockquote]:pl-4 [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_p]:leading-8 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#8C7967] dark:text-[#8A7D75]">
            <Link href="/crm/blog" className="hover:text-[#B87B68]">
              Blog Posts
            </Link>{" "}
            / Edit Post
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1
              className="text-3xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Edit Post
            </h1>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                status,
              )}`}
            >
              {status}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#8C7967] dark:text-[#8A7D75]">
            Last saved: {lastSavedAt ? formatDateTime(lastSavedAt) : "N/A"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-h-5 text-sm text-[#8C7967] dark:text-[#8A7D75]">
            {saveStatus === "saving" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {saveMessage}
              </span>
            ) : saveMessage ? (
              <span
                className={
                  saveStatus === "error"
                    ? "text-red-600 dark:text-red-300"
                    : "text-[#6E6257] dark:text-[#D8C7B5]"
                }
              >
                {saveMessage}
              </span>
            ) : (
              <span>Auto-save every 60 seconds</span>
            )}
          </div>

          <Link
            href={`/blog/${currentSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#EADDCD] px-4 text-sm font-semibold text-[#2B2B2B] transition-colors hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:text-[#F0EDE8]"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </Link>
          <button
            type="button"
            onClick={() => void handleSaveDraft()}
            disabled={saveStatus === "saving"}
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#2B2B2B] px-5 text-sm font-semibold text-[#2B2B2B] transition-colors hover:bg-[#2B2B2B] hover:text-[#F8F5F0] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#F0EDE8] dark:text-[#F0EDE8] dark:hover:bg-[#F0EDE8] dark:hover:text-[#141210]"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => void handlePublishToggle()}
            disabled={saveStatus === "saving"}
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#B87B68] px-5 text-sm font-semibold text-[#141210] transition-colors hover:bg-[#C98B78] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "PUBLISHED" ? "Unpublish" : "Publish"}
          </button>
          <button
            type="button"
            onClick={() => void handleArchive()}
            disabled={saveStatus === "saving"}
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Archive
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-[#EADDCD] bg-white p-5 dark:border-[#3D3530] dark:bg-[#242220]">
        {coverImage ? (
          <div className="relative overflow-hidden rounded-xl border border-[#EADDCD] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#1A1814]">
            <div className="relative aspect-[21/9] w-full">
              <Image
                src={coverImage}
                alt="Blog cover preview"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => setCoverImage("")}
              className="absolute right-3 top-3 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#2B2B2B]/90 px-3 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#2B2B2B]"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingCover(true);
            }}
            onDragLeave={() => setIsDraggingCover(false)}
            onDrop={handleCoverDrop}
            className={`flex min-h-[240px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 text-center transition-colors ${
              isDraggingCover
                ? "border-[#B87B68] bg-[#B87B68]/10"
                : "border-[#EADDCD] bg-[#F8F5F0] hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:bg-[#1A1814]"
            }`}
          >
            {isUploadingCover ? (
              <Loader2 className="h-8 w-8 animate-spin text-[#B87B68]" />
            ) : (
              <ImagePlus className="h-9 w-9 text-[#B87B68]" />
            )}
            <span className="mt-4 text-sm font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]">
              Drag and drop a cover image, or click to upload
            </span>
          </button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverInputChange}
        />
      </section>

      <section className="rounded-xl border border-[#EADDCD] bg-white p-5 dark:border-[#3D3530] dark:bg-[#242220]">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Post Title..."
          className="w-full border-0 bg-transparent px-0 text-3xl font-semibold text-[#2B2B2B] outline-none placeholder:text-[#8C7967]/70 dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
          style={{ fontFamily: "Playfair Display, serif" }}
        />

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
            Slug
          </span>
          <input
            type="text"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="h-11 w-full rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-4 text-sm text-[#2B2B2B] outline-none focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
          />
          <p className="mt-2 text-sm text-[#8C7967] dark:text-[#8A7D75]">
            URL: selenitecare.com/blog/{normalizedSlug}
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-300">
            Changing slug will break existing links.
          </p>
        </label>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Category
            </span>
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 w-full rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-4 text-sm text-[#2B2B2B] outline-none focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Tags
            </span>
            <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-3 py-2 focus-within:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[#B87B68]/15 px-3 py-1 text-xs font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setTags((currentTags) =>
                        currentTags.filter((currentTag) => currentTag !== tag),
                      )
                    }
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTag(tagInput)}
                placeholder={tags.length ? "Add tag" : "Type tag and press Enter"}
                className="h-7 min-w-[160px] flex-1 border-0 bg-transparent text-sm text-[#2B2B2B] outline-none placeholder:text-[#8C7967] dark:text-[#F0EDE8] dark:placeholder:text-[#8A7D75]"
              />
            </div>
          </label>
        </div>

        <label className="mt-6 block">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
              Meta description (shown in Google search results and blog cards)
            </span>
            <span className="text-xs text-[#8C7967] dark:text-[#8A7D75]">
              {excerpt.length}/160
            </span>
          </div>
          <textarea
            value={excerpt}
            maxLength={160}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-4 py-3 text-sm leading-6 text-[#2B2B2B] outline-none focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
          />
        </label>
      </section>

      <section>
        <BlogEditor value={content} onChange={setContent} />
      </section>
    </div>
  );
}
