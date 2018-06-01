'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');

exports.command = 'parse';
exports.describe = 'parse the header of an input file';
exports.builder = {
  file: {
    describe: 'a file to parse',
  },
};

exports.parse = function parse(file) {
  const parsed = /^([\W\w]+?)\n---\n([\W\w]*)/g.exec(file);
  if (parsed[1]) {
    const keys = yaml.safeLoad(parsed[1]);
    [,, keys.body] = parsed;
    return keys;
  }
  return {};
};

exports.handler = function handler(argv) {
  if (!argv.file) {
    console.log('ERROR: No filename provided.');
    process.exit(1);
  }
  console.log(exports.parse(fs.readFileSync(argv.file, 'utf-8')));
};
