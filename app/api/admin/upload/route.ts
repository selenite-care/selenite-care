import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { uploadToSupabase } from "@/lib/supabaseStorage";

const { auth } = NextAuth(authConfig);

export const runtime = "nodejs";

async function requireStaffUploadAccess() {
  const session = await auth();

  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "CRM") {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

function buildDoctorImagePath(fileName: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const safeFileName = fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  return `doctors/${timestamp}-${random}-${safeFileName || "image"}`;
}

export async function POST(request: Request) {
  const adminError = await requireStaffUploadAccess();

  if (adminError) {
    return adminError;
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
    const secureUrl = await uploadToSupabase(
      file,
      "selenite-doctors",
      buildDoctorImagePath(file.name),
      file.type,
    );

    return Response.json({ secure_url: secureUrl });
  } catch (error) {
    console.error("Supabase doctor image upload failed:", error);
    return Response.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
