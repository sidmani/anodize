#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const argv = require('yargs')
  .option('working-dir', {
    alias: ['input', 'i'],
    describe: 'Set the working directory',
    default: '.',
  })
  .option('source', {
    alias: ['s'],
    describe: 'The directory containing source files',
  })
  .option('static', {
    describe: 'A directory containing static assets',
  })
  .option('target', {
    alias: ['t'],
    describe: 'The directory in which to store generated files',
  })
  .option('extension', {
    alias: ['e'],
    describe: 'The file extension to append to generated files'
  })
  .option('ignore', {
    describe: 'Ignore files matching glob patterns',
    array: true,
  })
  .middleware([function(argv) {
    let config = {};
    try {
      config = yaml.safeLoad(fs.readFileSync(path.join(argv.input, '.anodize.yml'), 'utf8'));
    } catch (e) {
      console.log('WARNING: no .anodize.yml found, using default options...');
    }
    argv.source = argv.source || config.source || 'src';
    argv.target = argv.target || config.target || 'gen';
    argv.static = argv.static || config.static || 'static';
    argv.extension = argv.extension || config.extension || 'html';
    argv.ignore = argv.ignore || config.ignore || ['**/.*'];
  }])
  .middleware([function(argv) {
    argv.path = {
      source: path.join(argv.input, argv.source),
      target: path.join(argv.input, argv.target),
      static: path.join(argv.input, argv.static),
      yaml: path.join(argv.input, '.anodize.yml'),
    };
  }])
  .commandDir('commands')
  .argv;
