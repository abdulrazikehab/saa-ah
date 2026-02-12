
import fs from 'fs';
const content = fs.readFileSync('e:/MyPC/Work/Projects/BlackBox/Frontend/src/pages/dashboard/AppBuilder.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
lines.forEach((line, i) => {
    const b = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    balance += b;
    if (balance < 0) {
        // console.log(`Negative balance at line ${i+1}: ${balance}`);
    }
});
console.log(`Final balance: ${balance}`);

// Find the first line where a block starts but doesn't end properly in a reasonable range
// (This is harder, let's just look at the end of the file)
console.log('--- End of file check ---');
for (let i = lines.length - 10; i < lines.length; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
