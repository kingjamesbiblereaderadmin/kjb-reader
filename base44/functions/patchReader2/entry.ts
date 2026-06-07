import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const path = "src/pages/BibleReader.jsx";
    let content = await Deno.readTextFile(path);
    
    // Add DropdownMenu import
    if (!content.includes('DropdownMenuTrigger')) {
      content = content.replace(
        "import { useLocation, useNavigate } from 'react-router-dom';",
        "import { useLocation, useNavigate } from 'react-router-dom';\nimport {\n  DropdownMenu,\n  DropdownMenuContent,\n  DropdownMenuItem,\n  DropdownMenuTrigger,\n} from '@/components/ui/dropdown-menu';"
      );
    }
    
    // Find the print button and replace it
    const findStr = `<button onClick={() => window.print()} onTouchEnd={(e) => { e.preventDefault(); window.print(); }} title="Print" className="hidden sm:flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"><Printer className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /><span className="hidden lg:inline">Print</span></button>`;
    
    const replaceStr = `<DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button title="Print" className="hidden sm:flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap">
                    <Printer className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                    <span className="hidden lg:inline">Print</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => window.print()} className="cursor-pointer">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Full Page
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => {
                    const html = \`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="utf-8">
                        <title>\${book.name} \${pos.chapter} - KJB</title>
                        <style>
                          body { font-family: 'Merriweather', 'Cormorant Garamond', Georgia, serif; padding: 40px 20px; max-width: 800px; margin: 0 auto; color: #000; line-height: 1.8; font-size: 12pt; }
                          h1 { font-size: 24pt; text-align: center; margin-bottom: 30px; font-weight: bold; }
                          p { margin-bottom: 12px; text-align: justify; }
                          sup { font-size: 0.7em; margin-right: 4px; font-weight: bold; }
                          i { font-style: italic; color: #333; }
                        </style>
                      </head>
                      <body onload="window.print(); setTimeout(() => window.close(), 500);">
                        <h1 style="font-family:Georgia,serif;font-size:20pt;">\${book.name} \${pos.chapter}</h1>
                        \${verses.map(v => \\\`<p><sup>\${v.verse}</sup>\${v.text.replace(/\\\\[/g, '<i>').replace(/\\\\]/g, '</i>')}</p>\\\`).join('')}
                      </body>
                      </html>
                    \`;
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(html);
                      printWindow.document.close();
                    } else {
                      alert("Please allow popups to print.");
                    }
                  }}>
                    <BookMarked className="w-4 h-4 mr-2" />
                    Print Chapter Contents
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>`;
              
    if (content.includes(findStr)) {
        content = content.replace(findStr, replaceStr);
    } else {
        return Response.json({ error: "Find string not found in BibleReader.jsx" });
    }
    
    await Deno.writeTextFile(path, content);
    
    return Response.json({ success: true, newLength: content.split('\\n').length });
  } catch (e) {
    return Response.json({ error: e.message });
  }
});