
import fs from 'fs';
const content = fs.readFileSync('e:/MyPC/Work/Projects/BlackBox/Frontend/src/pages/dashboard/AppBuilder.tsx', 'utf8');
const lines = content.split('\n');

console.log('--- Line by Line Balance ---');
let balance = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div/g) || []).length;
    const self = (line.match(/<div[^>]*\/>/g) || []).length;
    
    const change = (opens - self) - closes;
    balance += change;
    
    if (change !== 0) {
        process.stdout.write(`L${i+1}: Bal ${balance} (O:${opens} S:${self} C:${closes})\n`);
    }
}
process.stdout.write(`Final Balance: ${balance}\n`);
