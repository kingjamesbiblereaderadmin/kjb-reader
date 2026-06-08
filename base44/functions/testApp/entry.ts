import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const file = await Deno.readTextFile("src/lib/bibleData.js");
  const match = file.match(/abbr:\s*'PSA'[^}]*apiName:\s*'([^']+)'/);
  return Response.json({ apiName: match ? match[1] : null });
});