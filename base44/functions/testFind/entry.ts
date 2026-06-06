import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const fs = await import("node:fs");
  const path = await import("node:path");

  const query1 = 'Galatians';
  const query2 = 'kjb-daily-verse-cache';
  
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
        if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.json')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes(query1) || content.includes(query2)) {
            // Find context snippet
            const lines = content.split('\n');
            const snippets = [];
            lines.forEach((line, i) => {
               if (line.includes(query1) || line.includes(query2)) {
                 snippets.push(`Line ${i+1}: ${line.trim()}`);
               }
            });
            results.push({ file: fullPath, snippets });
          }
        }
      }
    }
    return results;
  };

  const results = searchFiles(Deno.cwd());
  return Response.json({ results });
});