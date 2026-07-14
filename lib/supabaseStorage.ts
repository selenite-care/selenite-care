import { createClient } from "@supabase/supabase-js";

function getSupabaseStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase storage environment variables are not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function toBuffer(file: File | Buffer) {
  if (Buffer.isBuffer(file)) {
    return file;
  }

  return Buffer.from(await file.arrayBuffer());
}

export async function uploadToSupabase(
  file: File | Buffer,
  bucket: string,
  path: string,
  contentType: string,
): Promise<string> {
  const supabase = getSupabaseStorageClient();
  const fileBuffer = await toBuffer(file);

  const { error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function deleteFromSupabase(bucket: string, path: string) {
  const supabase = getSupabaseStorageClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw error;
  }
}
