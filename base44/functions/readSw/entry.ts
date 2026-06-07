import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as fs from 'node:fs';
import * as path from 'node:path';

Deno.serve(async (req) => {
    try {
        const text = fs.readFileSync(path.join(Deno.cwd(), 'public/sw.js'), 'utf-8');
        return Response.json({ text });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});