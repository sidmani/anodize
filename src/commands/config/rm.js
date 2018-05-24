'use strict';

const path = require('path');
const fs = require('fs');

exports.command = 'remove';
exports.aliases = ['rm'];
exports.describe = 'Delete the configuration file';
exports.handler = function(argv) {
  try {
    fs.unlinkSync(path.join(argv.input, '.anodize.yml'));
  } catch (e) {
    console.log('ERROR: could not find .anodize.yml');
  }
};
