export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    success: true,
    disabled: true,
    message: "Automatic unverified user cleanup is disabled.",
  });
}
