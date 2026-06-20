const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json'));
console.log(pkg.contributes.configuration.properties['devio.agentLLMs']);
