import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as fs from 'node:fs';

Deno.serve(async (req) => {
  return Response.json({ root: fs.readdirSync('/') });
});