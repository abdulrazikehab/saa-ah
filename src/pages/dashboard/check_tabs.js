
import fs from 'fs';
const content = fs.readFileSync('e:/MyPC/Work/Projects/BlackBox/Frontend/src/pages/dashboard/AppBuilder.tsx', 'utf8');
const lines = content.split('\n');

console.log('--- TabsContent triggers ---');
lines.forEach((line, i) => {
    if (line.includes('<TabsContent')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
    if (line.includes('</TabsContent')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
});
