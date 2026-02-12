
const fs = require('fs');
const content = fs.readFileSync('e:\\MyPC\\Work\\Projects\\BlackBox\\Frontend\\src\\pages\\dashboard\\AppBuilder.tsx', 'utf8');
const lines = content.split('\n');
process.stdout.write(JSON.stringify(lines[1554]) + '\n');
process.stdout.write(JSON.stringify(lines[1555]) + '\n');
process.stdout.write(JSON.stringify(lines[1556]) + '\n');
