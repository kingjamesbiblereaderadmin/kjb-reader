import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
Deno.serve(async (req) => {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const body = await req.json().catch(() => ({}));
  const query = 'kjb-daily-verse-cache';
  
  const searchFiles = (dir) => {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!fullPath.includes('.git') && !fullPath.includes('node_modules')) {
          results = results.concat(searchFiles(fullPath));
        }
      } else {
        if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes(query)) {
            results.push(fullPath);
          }
        }
      }
    }
    return results;
  };

  const results = searchFiles(Deno.cwd());
  return Response.json({ results });
});