import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const content = await Deno.readTextFile("public/sw.js");
    return Response.json({ content });
  } catch (error) {
    return Response.json({ error: error.message });
  }
});