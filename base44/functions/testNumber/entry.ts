import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const code = await req.json();
  const result = eval(code.code);
  return Response.json({ result });
});