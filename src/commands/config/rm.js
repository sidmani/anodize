'use strict';

const fs = require('fs-extra');

exports.command = 'remove';
exports.aliases = ['rm'];
exports.describe = 'Delete the configuration file';
exports.handler = function handler(argv) {
  try {
    fs.unlinkSync(argv.path.yaml);
  } catch (e) {
    console.log('ERROR: could not find .anodize.yml');
  }
};
