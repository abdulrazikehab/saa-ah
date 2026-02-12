
const fs = require('fs');
const filePath = 'e:\\MyPC\\Work\\Projects\\BlackBox\\Frontend\\src\\pages\\dashboard\\AppBuilder.tsx';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

let designTabLine = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("TabsContent value='design'")) {
        designTabLine = i;
        // Check if next line is ScrollArea
        if (lines[i+1].includes('ScrollArea') && lines[i+1].includes('px-5 pb-10 pt-6')) {
            console.log(`Found Design tab at line ${i+1}`);
            
            // Replace ScrollArea line
            lines[i+1] = lines[i+1].replace("className='flex-1 h-full px-5 pb-10 pt-6'", "className='flex-1 h-full w-full'");
            
            // Replace inner div line padding
            if (lines[i+2].includes("className='space-y-8'")) {
                 lines[i+2] = lines[i+2].replace("className='space-y-8'", "className='space-y-8 px-5 pt-6 pb-24'");
            }
            
            // Also append relative overflow-hidden to TabsContent if not present
            if (!lines[i].includes('relative overflow-hidden')) {
                 lines[i] = lines[i].replace("flex-col'", "flex-col relative overflow-hidden'");
            }
            
            fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
            console.log('Successfully updated Design tab scrolling.');
            process.exit(0);
        }
    }
}
console.log('Design tab ScrollArea not found or already updated.');
process.exit(1);
