Deno.serve(async (req) => {
  try {
    const TEXT_URL = 'https://www.bibleprotector.com/WHARTON_PCE.txt';
    const res = await fetch(TEXT_URL);
    if (!res.ok) throw new Error('Failed to fetch Bible text');
    const text = await res.text();
    
    const lines = text.split('\n');
    const samples = [];
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      // Look for colophon markers: lines ending with <<[...written...]>>
      if (trimmed.includes('<<[') && trimmed.includes('written') && trimmed.includes('>>')) {
        samples.push({
          index: i,
          line: trimmed
        });
        if (samples.length >= 50) break;
      }
    }
    
    return Response.json({ samples });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});