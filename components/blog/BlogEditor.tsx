"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";

type BlogEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

type ToolbarButtonProps = {
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const defaultPlaceholder =
  "Write your blog post here... Share your skincare insights!";

function ToolbarButton({
  label,
  isActive = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive
          ? "border-[#B87B68] bg-[#B87B68] text-[#F8F5F0]"
          : "border-[#EADDCD] bg-[#F8F5F0] text-[#2B2B2B] hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
      }`}
    >
      {children}
    </button>
  );
}

function setLink(editor: Editor, url: string) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  const normalizedUrl = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: normalizedUrl })
    .run();
}

export default function BlogEditor({
  value,
  onChange,
  placeholder = defaultPlaceholder,
}: BlogEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLinkPanelOpen, setIsLinkPanelOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener",
        },
      }),
      Image.configure({
        inline: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "blog-editor-prose min-h-[400px] px-6 py-4 text-[#2B2B2B] outline-none dark:text-[#F0EDE8]",
      },
    },
    onUpdate({ editor: currentEditor }) {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || value === editor.getHTML()) {
      return;
    }

    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    if (!editor || !isLinkPanelOpen) {
      return;
    }

    setLinkUrl(editor.getAttributes("link").href ?? "");
  }, [editor, isLinkPanelOpen]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !editor) {
      return;
    }

    setIsUploadingImage(true);
    setUploadError("");

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
        throw new Error(data?.error ?? "Unable to upload image.");
      }

      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Unable to upload image.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  const isDisabled = !editor;

  return (
    <div className="rounded-xl border border-[#EADDCD] bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#181513]">
      <style>{`
        .blog-editor-prose p {
          margin: 0 0 1rem;
          line-height: 1.8;
        }

        .blog-editor-prose h1,
        .blog-editor-prose h2,
        .blog-editor-prose h3,
        .blog-editor-prose h4 {
          margin: 1.5rem 0 0.75rem;
          color: inherit;
          font-family: "Playfair Display", serif;
          font-weight: 700;
          line-height: 1.2;
        }

        .blog-editor-prose h1 {
          font-size: 2rem;
        }

        .blog-editor-prose h2 {
          font-size: 1.65rem;
        }

        .blog-editor-prose h3 {
          font-size: 1.35rem;
        }

        .blog-editor-prose h4 {
          font-size: 1.15rem;
        }

        .blog-editor-prose ul,
        .blog-editor-prose ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        .blog-editor-prose ul {
          list-style: disc;
        }

        .blog-editor-prose ol {
          list-style: decimal;
        }

        .blog-editor-prose li {
          margin: 0.35rem 0;
          line-height: 1.7;
        }

        .blog-editor-prose blockquote {
          margin: 1.25rem 0;
          border-left: 4px solid #B87B68;
          background: rgba(184, 123, 104, 0.08);
          padding: 0.85rem 1rem;
          color: #6E6257;
        }

        .dark .blog-editor-prose blockquote {
          color: #D8C7B5;
        }

        .blog-editor-prose pre {
          margin: 1rem 0;
          overflow-x: auto;
          border-radius: 0.75rem;
          background: #2B2B2B;
          padding: 1rem;
          color: #F8F5F0;
        }

        .blog-editor-prose code {
          border-radius: 0.35rem;
          background: rgba(43, 43, 43, 0.08);
          padding: 0.12rem 0.32rem;
          font-size: 0.9em;
        }

        .blog-editor-prose pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }

        .blog-editor-prose a {
          color: #B87B68;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .blog-editor-prose img {
          margin: 1.25rem auto;
          max-width: 100%;
          border-radius: 0.75rem;
        }

        .blog-editor-prose .is-empty::before {
          float: left;
          height: 0;
          color: #8C7967;
          content: attr(data-placeholder);
          pointer-events: none;
        }
      `}</style>

      <div className="flex flex-wrap items-center gap-2 rounded-t-xl border-b border-[#EADDCD] bg-[#F8F5F0] p-3 dark:border-[#3D3530] dark:bg-[#181513]">
        <ToolbarButton
          label="Bold"
          disabled={isDisabled}
          isActive={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          disabled={isDisabled}
          isActive={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          disabled={isDisabled}
          isActive={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          disabled={isDisabled}
          isActive={editor?.isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-7 w-px bg-[#EADDCD] dark:bg-[#3D3530]" />

        <ToolbarButton
          label="Heading 1"
          disabled={isDisabled}
          isActive={editor?.isActive("heading", { level: 1 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          disabled={isDisabled}
          isActive={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          disabled={isDisabled}
          isActive={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-7 w-px bg-[#EADDCD] dark:bg-[#3D3530]" />

        <ToolbarButton
          label="Bullet list"
          disabled={isDisabled}
          isActive={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          disabled={isDisabled}
          isActive={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Blockquote"
          disabled={isDisabled}
          isActive={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          disabled={isDisabled}
          isActive={editor?.isActive("codeBlock")}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-7 w-px bg-[#EADDCD] dark:bg-[#3D3530]" />

        <ToolbarButton
          label="Link"
          disabled={isDisabled}
          isActive={editor?.isActive("link")}
          onClick={() => setIsLinkPanelOpen((current) => !current)}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align left"
          disabled={isDisabled}
          isActive={editor?.isActive({ textAlign: "left" })}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          disabled={isDisabled}
          isActive={editor?.isActive({ textAlign: "center" })}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          disabled={isDisabled}
          isActive={editor?.isActive({ textAlign: "right" })}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <span className="mx-1 h-7 w-px bg-[#EADDCD] dark:bg-[#3D3530]" />

        <ToolbarButton
          label={isUploadingImage ? "Uploading image" : "Upload image"}
          disabled={isDisabled || isUploadingImage}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>

      {isLinkPanelOpen ? (
        <div className="flex flex-col gap-2 border-b border-[#EADDCD] bg-white px-3 py-3 dark:border-[#3D3530] dark:bg-[#242220] sm:flex-row sm:items-center">
          <input
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.com"
            className="h-10 min-w-0 flex-1 rounded-md border border-[#EADDCD] bg-[#F8F5F0] px-3 text-sm text-[#2B2B2B] outline-none focus:border-[#B87B68] dark:border-[#3D3530] dark:bg-[#1A1814] dark:text-[#F0EDE8]"
          />
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-semibold text-[#F8F5F0] transition-colors hover:bg-[#3A3734] dark:bg-[#B87B68] dark:text-[#141210]"
            onClick={() => {
              if (editor) {
                setLink(editor, linkUrl);
              }
              setIsLinkPanelOpen(false);
            }}
          >
            Apply
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#EADDCD] px-4 text-sm font-semibold text-[#2B2B2B] transition-colors hover:border-[#B87B68] hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:text-[#F0EDE8]"
            onClick={() => {
              editor?.chain().focus().extendMarkRange("link").unsetLink().run();
              setLinkUrl("");
              setIsLinkPanelOpen(false);
            }}
          >
            Remove
          </button>
        </div>
      ) : null}

      {uploadError ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {uploadError}
        </div>
      ) : null}

      <div className="rounded-b-xl border-t-0 border-[#EADDCD] bg-white dark:border-[#3D3530] dark:bg-[#242220]">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-end rounded-b-xl border-t border-[#EADDCD] bg-[#F8F5F0] px-4 py-2 text-xs text-[#6E6257] dark:border-[#3D3530] dark:bg-[#181513] dark:text-[#8A7D75]">
        {editor?.storage.characterCount.characters() ?? 0} characters
      </div>
    </div>
  );
}
