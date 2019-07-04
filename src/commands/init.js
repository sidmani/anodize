'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

exports.command = 'init';
exports.describe = 'create the directory structure';
exports.builder = {
  gitignore: {
    default: false,
    boolean: true,
    describe: 'append <gen>/ to .gitignore if found',
  },
};

exports.handler = function handler(argv) {
  // create the target directory
  fs.mkdirpSync(argv.path.target);

  // create the source directory
  fs.mkdirpSync(argv.path.source);

  // create the template directory
  fs.mkdirpSync(argv.path.template);

  // create .anodize.yml, overwriting if necessary
  const conf = {
    target: argv.target,
    source: argv.source,
    template: argv.template,
    ignore: argv.ignore,
  };

  const output = `# .anodize.yml\n${yaml.safeDump(conf)}`;
  fs.writeFileSync(argv.path.yaml, output);

  // append <root>/ to .gitignore
  if (argv.gitignore) {
    const gitignorePath = path.join(argv.input, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      fs.appendFileSync(gitignorePath, `\n ${argv.target}`);
    }
  }
};
