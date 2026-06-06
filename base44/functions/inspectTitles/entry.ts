import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const url = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeEditionTextfile2.txt';
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n');

  let report = "--- FINDING TITLES ---\n";

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim().toUpperCase();
    if (l.includes('ECCLESIASTES')) {
      report += `Found ECCLESIASTES at line ${i}: ${lines[i-1]}\n${lines[i]}\n${lines[i+1]}\n---\n`;
    }
    if (l.includes('TITUS')) {
      report += `Found TITUS at line ${i}: ${lines[i-1]}\n${lines[i]}\n${lines[i+1]}\n---\n`;
    }
    if (l.includes('PHILEMON')) {
      report += `Found PHILEMON at line ${i}: ${lines[i-1]}\n${lines[i]}\n${lines[i+1]}\n---\n`;
    }
  }

  return Response.json({ report });
});