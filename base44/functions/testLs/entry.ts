import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
Deno.serve(async (req) => {
  try {
    const files = [];
    for await (const dirEntry of Deno.readDir("./public")) {
      files.push(dirEntry.name);
    }
    return Response.json({ files });
  } catch (err) {
    return Response.json({ error: err.message });
  }
});