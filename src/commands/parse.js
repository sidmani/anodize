'use strict';

const fs = require('fs-extra');

exports.command = 'parse';
exports.describe = 'parse the header of an input file';
exports.builder = {
  file: {
    describe: 'a file to parse',
  },
};

exports.parse = function parse(file) {
  const header = /^([\W\w]+?)\n---/g.exec(file);
  if (header) {
    const title = /^([\W\w]+?)\n/g.exec(header)[1];
    const body = /^[\W\w]*?\n---\n([\W\w]*)/g.exec(file)[1];
    const keys = { title, body };

    const keyRegex = /([\w]+?): ([\w\W]+?)\n/g;
    let next;
    while ((next = keyRegex.exec(header)) !== null) {
      keys[next[1]] = next[2];
    }
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
