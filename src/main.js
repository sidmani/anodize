#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');
const configRead = require('./commands/config/read.js');
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
  .option('generated', {
    alias: ['g'],
    describe: 'The directory in which to store generated files',
  })
  .option('extension', {
    alias: ['e'],
    describe: 'The file extension to append to generated files'
  })
  .middleware([function(argv) {
    let config = {};
    try {
      config = configRead.read(argv.i);
    } catch (e) {
      console.log('WARNING: no .anodize.yml found, using defaults...');
    }
    argv.source = argv.source || config.source || 'src';
    argv.generated = argv.generated || config.generated || 'gen';
    argv.extension = argv.extension || config.extension || 'html';
  }])
  .commandDir('commands')
  .argv;
