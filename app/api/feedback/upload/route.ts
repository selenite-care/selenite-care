export async function POST() {
  return Response.json(
    { error: "Feedback image uploads are disabled." },
    { status: 403 },
  );
}
