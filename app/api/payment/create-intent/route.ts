function retiredEndpoint() {
  return Response.json(
    { error: "This endpoint is retired" },
    { status: 410 },
  );
}

export {
  retiredEndpoint as DELETE,
  retiredEndpoint as GET,
  retiredEndpoint as HEAD,
  retiredEndpoint as OPTIONS,
  retiredEndpoint as PATCH,
  retiredEndpoint as POST,
  retiredEndpoint as PUT,
};
