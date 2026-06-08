import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as fs from 'node:fs';

Deno.serve(async (req) => {
  try {
    const files = fs.readdirSync(Deno.cwd());
    const parent = fs.readdirSync('..');
    return Response.json({ cwd: Deno.cwd(), files, parent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});