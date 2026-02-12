
import fs from 'fs';
const content = fs.readFileSync('e:/MyPC/Work/Projects/BlackBox/Frontend/src/pages/dashboard/AppBuilder.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) {
        if (line.includes('<div') || line.includes('</div')) {
            console.log(`Commented div at line ${i + 1}: ${line.trim()}`);
        }
    }
});
