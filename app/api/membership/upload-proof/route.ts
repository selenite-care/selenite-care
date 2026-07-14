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

function buildProofImagePath(fileName: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const safeFileName = fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  return `proofs/${timestamp}-${random}-${safeFileName || "image"}`;
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

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  try {
    const publicUrl = await uploadToSupabase(
      file,
      "selenite-proofs",
      buildProofImagePath(file.name),
      file.type,
    );

    return Response.json({ secure_url: publicUrl });
  } catch (error) {
    console.error("Membership proof upload failed:", error);
    return Response.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
