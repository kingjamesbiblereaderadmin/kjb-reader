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
      
      // Look for colophon markers: lines ending with <<[...written...]>>
      if (trimmed.includes('<<[') && trimmed.includes('written') && trimmed.includes('>>')) {
        samples.push({
          index: i,
          line: trimmed.slice(0, 200)
        });
        if (samples.length >= 15) break;
      }
    }
    
    return Response.json({ samples });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});