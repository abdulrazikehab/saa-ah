
import fs from 'fs';
const content = fs.readFileSync('e:/MyPC/Work/Projects/BlackBox/Frontend/src/pages/dashboard/AppBuilder.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;
    const self = (line.match(/<div[^>]*\/>/g) || []).length;
    
    balance += (opens - self) - closes;
    // process.stdout.write matches signature?
    if ((opens - self) - closes !== 0) {
        process.stdout.write(`L${i+1}: Bal ${balance}\n`);
    }
}
process.stdout.write(`Final Bal: ${balance}\n`);
