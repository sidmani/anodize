'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');

exports.command = 'read';
exports.aliases = ['ls'];
exports.describe = 'Display the parsed configuration file';

exports.handler = function handler(argv) {
  try {
    const conf = yaml.safeLoad(fs.readFileSync(argv.path.yaml, 'utf8'));
    Object.keys(conf).forEach(key =>
      console.log(key + ': ' + conf[key]));
  } catch (e) {
    console.log('ERROR: could not open .anodize.yml');
  }
};
