Deno.serve(async (req) => {
  try {
    const TEXT_URL = 'https://media.base44.com/files/public/6a05adcee684459ea05d28a4/ee659445e_TEXT-PCE-127.txt';
    const res = await fetch(TEXT_URL);
    if (!res.ok) throw new Error('Failed to fetch Bible text');
    const text = await res.text();
    
    const lines = text.split('\n');
    const samples = [];
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      // Look for pattern: 2-3 char abbr + pilcrow + bracket (e.g., "Heb ¶[...]")
      if (trimmed.match(/^[A-Z][a-z0-9]{0,2}\s+¶\s*\[/)) {
        samples.push({
          index: i,
          line: trimmed,
          prevLine: lines[i - 1]?.trim().slice(0, 80) || 'START'
        });
        // Only collect first 10 samples
        if (samples.length >= 10) break;
      }
    }
    
    return Response.json({ samples });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});