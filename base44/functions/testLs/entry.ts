Deno.serve(async (req) => {
  const files = [];
  try {
    for await (const entry of Deno.readDir('pages')) {
      files.push({name: entry.name, isFile: entry.isFile});
    }
    return Response.json({ files });
  } catch (e) {
    return Response.json({ error: e.message });
  }
});