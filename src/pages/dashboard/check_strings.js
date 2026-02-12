
import fs from 'fs';
const content = fs.readFileSync('e:/MyPC/Work/Projects/BlackBox/Frontend/src/pages/dashboard/AppBuilder.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
    if ((line.includes("'") || line.includes('"')) && (line.includes('<div') || line.includes('</div'))) {
        // Simple check if it's inside a string
        const insideSingle = (line.split("'").length - 1) % 2 !== 0; // Rough check
        const insideDouble = (line.split('"').length - 1) % 2 !== 0;
        
        // Better regex check
        const stringRegex = /'[^']*<div[^']*'|"[^"]*<div[^"]*"/g;
        const matches = line.match(stringRegex);
        if (matches) {
             console.log(`Line ${i+1}: Div inside string: ${matches[0]}`);
        }
    }
});
