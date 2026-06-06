import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const url = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n');

  let books = new Set();
  for (let i = 0; i < lines.length; i++) {
    const spaceIdx = lines[i].indexOf(' ');
    if (spaceIdx !== -1) {
      books.add(lines[i].substring(0, spaceIdx));
    }
  }

  let arr = Array.from(books);
  
  return Response.json({ count: arr.length, first10: arr.slice(0, 10), index47: arr[47] });
});