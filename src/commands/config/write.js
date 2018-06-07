'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');

exports.command = 'write';
exports.aliases = ['w'];
exports.describe = 'Modify the configuration file';

exports.handler = function handler(argv) {
  const conf = {
    target: argv.target,
    source: argv.source,
    template: argv.template,
    ignore: argv.ignore,
  };

  const output = `# .anodize.yml\n${yaml.safeDump(conf)}`;
  fs.writeFileSync(argv.path.yaml, output);
};
