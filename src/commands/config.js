'use strict';

exports.command = 'config <command>';
exports.describe = 'manage the anodize configuration';
exports.builder = function(yargs) {
  return yargs.commandDir('config');
};
exports.handler = function(argv) {};
