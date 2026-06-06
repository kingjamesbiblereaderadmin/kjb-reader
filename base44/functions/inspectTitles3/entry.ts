import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const url = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeEditionTextfile2.txt';
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n');

  let report = "--- FINDING TITUS/PHILEMON ---\n";

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim().toUpperCase();
    if (l.includes('PAUL, A SERVANT OF GOD')) {
      report += `Found Titus 1:1 at line ${i}:\n`;
      for(let j=i-5; j<=i; j++) report += `${lines[j]}\n`;
      report += `---\n`;
    }
    if (l.includes('PAUL, A PRISONER OF JESUS CHRIST')) {
      report += `Found Philemon 1:1 at line ${i}:\n`;
      for(let j=i-5; j<=i; j++) report += `${lines[j]}\n`;
      report += `---\n`;
    }
  }

  return Response.json({ report });
});