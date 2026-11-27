import { deleteManyFromSupabase } from "@/lib/supabaseStorage";

export const PRESCRIPTION_BUCKET = "selenite-prescriptions";

export async function deletePrescriptionFiles(paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  if (uniquePaths.length === 0) {
    return;
  }

  await deleteManyFromSupabase(PRESCRIPTION_BUCKET, uniquePaths);
}
