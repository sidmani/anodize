'use strict';

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

exports.command = 'read';
exports.aliases = ['ls'];
exports.describe = 'Display the parsed configuration file';

exports.read = function(input) {
  const yaml_path = path.join(input, '.anodize.yml');
  return yaml.safeLoad(fs.readFileSync(yaml_path, 'utf8'));
}

exports.handler = function (argv) {
  try {
    const conf = exports.read(argv.i);
    Object.keys(conf).forEach(key => {
      console.log(key + ': ' + conf[key]);
    });
  } catch (e) {
    console.log('ERROR: could not open .anodize.yml');
  }
};
