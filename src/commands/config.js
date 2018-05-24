'use strict';

const yargs = require('yargs');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

exports.command = 'config <command>';
exports.describe = 'manage the anodize configuration';
exports.builder = function(yargs) {
  return yargs.commandDir('config');
};
exports.handler = function(argv) {};
