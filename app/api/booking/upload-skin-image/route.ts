import { auth } from "@/auth";
import { uploadToSupabase } from "@/lib/supabaseStorage";

export const runtime = "nodejs";

async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}

function buildSkinImagePath(fileName: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const safeFileName = fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  return `skin-photos/${timestamp}-${random}-${safeFileName || "image"}`;
}

function getImageContentType(file: File) {
  const lowerName = file.name.toLowerCase();

  if (file.type.startsWith("image/")) {
    return file.type;
  }

  if (lowerName.endsWith(".heic")) {
    return "image/heic";
  }

  if (lowerName.endsWith(".heif")) {
    return "image/heif";
  }

  return null;
}

export async function POST(request: Request) {
  const sessionError = await requireSession();

  if (sessionError) {
    return sessionError;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "A file field is required." }, { status: 400 });
  }

  const contentType = getImageContentType(file);

  if (!contentType) {
    return Response.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  try {
    const publicUrl = await uploadToSupabase(
      file,
      "selenite-skin-photos",
      buildSkinImagePath(file.name),
      contentType,
    );

    return Response.json({ secure_url: publicUrl });
  } catch (error) {
    console.error("Skin image upload failed:", error);
    return Response.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
