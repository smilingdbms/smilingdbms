// fix-tsconfig.js
const fs = require('fs');
const path = require('path');

const tsPath = path.join(__dirname, 'tsconfig.json');
let ts = JSON.parse(fs.readFileSync(tsPath, 'utf8'));

fs.copyFileSync(tsPath, tsPath + '.bak');

// Fix: set target to ES2015+ and enable downlevelIteration
ts.compilerOptions = ts.compilerOptions || {};
ts.compilerOptions.target = 'ES2017';
ts.compilerOptions.downlevelIteration = true;
ts.compilerOptions.lib = ts.compilerOptions.lib || ['dom', 'dom.iterable', 'esnext'];

fs.writeFileSync(tsPath, JSON.stringify(ts, null, 2));
console.log('✅ tsconfig.json fixed — target set to ES2017, downlevelIteration enabled');
console.log('Run: npm run build');
