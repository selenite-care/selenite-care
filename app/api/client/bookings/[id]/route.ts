export async function PATCH() {
  return Response.json(
    { error: "Please contact Selenite Care to cancel your booking." },
    { status: 403 }
  )
}