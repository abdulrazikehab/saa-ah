
const fs = require('fs');
const content = fs.readFileSync('e:\\MyPC\\Work\\Projects\\BlackBox\\Frontend\\src\\pages\\dashboard\\AppBuilder.tsx', 'utf8');
const lines = content.split('\n');
const context = lines.slice(1553, 1560).map((l, i) => `${1554+i}: ${JSON.stringify(l)}`).join('\n');
fs.writeFileSync('e:\\MyPC\\Work\\Projects\\BlackBox\\Frontend\\src\\pages\\dashboard\\debug_1555.txt', context);
