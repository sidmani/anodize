'use strict';

const path = require('path');
const fs = require('fs-extra');

exports.command = 'remove';
exports.aliases = ['rm'];
exports.describe = 'Delete the configuration file';
exports.handler = function(argv) {
  try {
    fs.unlinkSync(argv.path.yaml);
  } catch (e) {
    console.log('ERROR: could not find .anodize.yml');
  }
};
