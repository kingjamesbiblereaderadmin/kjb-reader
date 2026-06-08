import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const cwd = Deno.cwd();
    const files = [];
    for await (const dirEntry of Deno.readDir(cwd)) {
      files.push(dirEntry.name);
    }
    return Response.json({ cwd, files });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});