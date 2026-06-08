import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
Deno.serve(async (req) => {
  try {
    const text = await Deno.readTextFile("./public/sw.js");
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: e.message });
  }
});