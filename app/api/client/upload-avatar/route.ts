import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { uploadToSupabase } from "@/lib/supabaseStorage";

const { auth } = NextAuth(authConfig);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
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
      "selenite-avatars",
      `avatars/${session.user.id}-${Date.now()}`,
      file.type,
    );

    return Response.json({ secure_url: publicUrl });
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return Response.json({ error: "Failed to upload avatar." }, { status: 500 });
  }
}
