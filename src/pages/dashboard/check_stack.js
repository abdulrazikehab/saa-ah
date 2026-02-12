
import fs from 'fs';
const content = fs.readFileSync('e:/MyPC/Work/Projects/BlackBox/Frontend/src/pages/dashboard/AppBuilder.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];

lines.forEach((line, i) => {
    const trimmed = line.trim();
    // Simple heuristic: assuming standard formatting
    // Count exact number of <div and </div
    // Be careful with self-closing and same-line close
    
    // Remove self-closing divs for counting
    let tempLine = line.replace(/<div[^>]*\/>/g, '');
    
    // Count Opens
    const opens = (tempLine.match(/<div(?![^>]*\/>)/g) || []).length;
    // Count Closes
    const closes = (tempLine.match(/<\/div>/g) || []).length;
    
    // Push line number for each open
    for (let k=0; k<opens; k++) stack.push(i+1);
    
    // Pop for each close
    for (let k=0; k<closes; k++) {
        if (stack.length === 0) {
            console.log(`Line ${i+1}: Extra closing div!`);
        } else {
            stack.pop();
        }
    }
});

if (stack.length > 0) {
    console.log(`Unclosed divs at lines: ${stack.join(', ')}`);
} else {
    console.log('Divs are balanced.');
}
