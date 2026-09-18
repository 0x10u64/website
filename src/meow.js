export async function meow(request, env) {
  const getMeows = async () => {
    const result = await env.DB.prepare(
      `
        SELECT value
        FROM kv_store
        WHERE key = 'meows'
      `,
    ).first();

    return parseInt(result.value);
  };

  switch (request.method) {
    case "GET":
      try {
        return Response.json({ meows: await getMeows() });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
      }
    case "POST":
      const result = await env.DB.prepare(
        `
          UPDATE kv_store
          SET value = CAST(value AS INTEGER) + 1
          WHERE key = 'meows'
          RETURNING value
        `,
      ).first();

      try {
        return Response.json({ meows: parseInt(result.value) });
      } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
      }
    default:
      return new Response("Method Not Allowed", { status: 405 });
  }
}
