import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const url = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeEditionTextfile2.txt';
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n');

  let report = "--- FINDING TITLES ---\n";

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim().toUpperCase();
    if (l === 'THE EPISTLE OF PAUL' || l === 'TO TITUS.' || l.includes('TO TITUS.') || l.includes('TO PHILEMON.') || l.includes('THE EPISTLE OF PAUL TO TITUS') || l.includes('THE EPISTLE OF PAUL TO PHILEMON')) {
      report += `Found at line ${i}: ${lines[i-1]}\n${lines[i]}\n${lines[i+1]}\n---\n`;
    }
  }

  return Response.json({ report });
});