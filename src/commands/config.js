'use strict';

exports.command = 'config <command>';
exports.describe = 'manage the anodize configuration';
exports.builder = function builder(yargs) {
  return yargs.commandDir('config');
};
exports.handler = function handler() {};
