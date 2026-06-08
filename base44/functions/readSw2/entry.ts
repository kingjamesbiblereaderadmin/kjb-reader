import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    let path = '';
    for await (const dirEntry of Deno.readDir('/')) {
       path += dirEntry.name + ', ';
    }
    for await (const dirEntry of Deno.readDir('/src')) {
       path += '/src/' + dirEntry.name + ', ';
    }
    return Response.json({ path });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});