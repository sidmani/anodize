'use strict';

const fs = require('fs-extra');
const path = require('path');
const writeConfig = require('./config/write.js');

exports.command = 'init';
exports.describe = 'create the directory structure';
exports.builder = {
  yaml: {
    default: true,
    describe: 'create .anodize.yml',
  },
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

  // create the static directory
  fs.mkdirpSync(argv.path.static);

  // create .anodize.yml, overwriting if necessary
  if (argv.yaml) {
    writeConfig.handler(argv);
  } else {
    // log
  }

  // append <root>/ to .gitignore
  if (argv.gitignore) {
    const gitignorePath = path.join(argv.input, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      fs.appendFileSync(gitignorePath, `\n ${argv.target}`);
    } else {
      // no .gitignore, skipping...
    }
  }
};
