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

async function assertPrivateBucket(
  supabase: ReturnType<typeof getSupabaseStorageClient>,
  bucket: string,
) {
  const { data, error } = await supabase.storage.getBucket(bucket);

  if (error) {
    throw error;
  }

  if (data.public) {
    throw new Error(`Storage bucket "${bucket}" must be private.`);
  }
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

export async function uploadPrivateToSupabase(
  file: File | Buffer,
  bucket: string,
  path: string,
  contentType: string,
): Promise<void> {
  const supabase = getSupabaseStorageClient();
  await assertPrivateBucket(supabase, bucket);
  const fileBuffer = await toBuffer(file);

  const { error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw error;
  }
}

export async function createSignedSupabaseUrl(
  bucket: string,
  path: string,
  expiresInSeconds: number,
): Promise<string> {
  const supabase = getSupabaseStorageClient();
  await assertPrivateBucket(supabase, bucket);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Unable to create a signed storage URL.");
  }

  return data.signedUrl;
}

export async function deleteFromSupabase(bucket: string, path: string) {
  await deleteManyFromSupabase(bucket, [path]);
}

export async function deleteManyFromSupabase(
  bucket: string,
  paths: string[],
) {
  if (paths.length === 0) {
    return;
  }

  const supabase = getSupabaseStorageClient();
  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw error;
  }
}
