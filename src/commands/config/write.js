'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

exports.command = 'write';
exports.aliases = ['w'];
exports.describe = 'Modify the configuration file';

exports.handler = function(argv) {
  let conf = {
    generated: argv.generated,
    source: argv.source,
    extension: argv.extension,
  };

  const output = '# .anodize.yml\n' + yaml.safeDump(conf);
  fs.writeFileSync(path.join(argv.input, '.anodize.yml'), output);
};
