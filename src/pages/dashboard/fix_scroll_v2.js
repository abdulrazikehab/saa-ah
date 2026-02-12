
const fs = require('fs');
const filePath = 'e:\\MyPC\\Work\\Projects\\BlackBox\\Frontend\\src\\pages\\dashboard\\AppBuilder.tsx';
try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    // Log line 1554 (index 1554 is line 1555)
    console.log(`Line 1555: ` + JSON.stringify(lines[1555]));
    console.log(`Searching for TabsContent value='design'`);
    
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("value='design'")) {
            console.log(`Found value='design' at line ${i+1}: ` + lines[i]);
            // Check scroll area next line?
            if (lines[i+1] && lines[i+1].includes("ScrollArea")) {
                console.log(`Found ScrollArea at line ${i+2}`);
                lines[i+1] = lines[i+1].replace("px-5 pb-10 pt-6", "w-full");
                // Remove flex-1 h-full if needed, but keeping them is fine if w-full overrides padding issues.
                // Replace inner div
                if (lines[i+2] && lines[i+2].includes("space-y-8")) {
                     lines[i+2] = lines[i+2].replace("space-y-8", "space-y-8 px-5 pt-6 pb-24");
                }
                
                // Add relative overflow-hidden to TabsContent
                if (!lines[i].includes("relative")) {
                    lines[i] = lines[i].replace("flex-col'", "flex-col relative overflow-hidden'");
                }
                
                fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
                console.log("Updated file successfully!");
                found = true;
                break;
            }
        }
    }
    
    if (!found) console.log("Did not find target lines.");
    
} catch (e) {
    console.error(e);
}
