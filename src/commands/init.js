'use strict'

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
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

exports.handler = function (argv) {
  // create the generated directory
  const gen_path = path.join(argv.input, argv.generated);
  if (!fs.existsSync(gen_path)) {
    fs.mkdirSync(gen_path);
  } else {
    // log
  }

  const src_path = path.join(argv.input, argv.source);
  if (!fs.existsSync(src_path)) {
    fs.mkdirSync(src_path);
  } else {
    // log
  }

  // create .anodize.yml, overwriting if necessary
  if (argv.yaml) {
    writeConfig.handler(argv);
  } else {
    // log
  }

  // append <root>/ to .gitignore
  if (argv.gitignore) {
    const gitignore_path = path.join(argv.input, '.gitignore');
    if (fs.existsSync(gitignore_path)) {
      fs.appendFileSync(gitignore_path, '\n' + argv.generated + '/');
    } else {
      // no .gitignore, skipping...
    }
  }
};
