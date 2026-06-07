import { walk } from "https://deno.land/std@0.170.0/fs/walk.ts";

Deno.serve(async (req) => {
  const results = [];
  
  try {
    for await (const entry of walk("/src", { exts: [".js", ".jsx", ".ts", ".tsx", ".json", ".html"], skip: [/node_modules/, /\.git/, /deno_dir/] })) {
      if (entry.isFile) {
        try {
          const content = await Deno.readTextFile(entry.path);
          if (content.toLowerCase().includes("pron") || content.toLowerCase().includes("proun")) {
            results.push(entry.path);
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
  
  return new Response(JSON.stringify({results}), {
    headers: { "content-type": "application/json" }
  });
});