#!/usr/bin/env node

'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const yargs = require('yargs')
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
    describe: 'The file extension to append to generated files',
  })
  .option('ignore', {
    describe: 'Ignore files matching glob patterns',
    array: true,
  })
  .middleware([(argv) => {
    let config = {};
    try {
      config = yaml.safeLoad(fs.readFileSync(path.join(argv.input, '.anodize.yml'), 'utf8'));
    } catch (e) {
      console.log('WARNING: .anodize.yml missing or invalid, using default options...');
    }
    /* eslint-disable no-param-reassign */
    // args that are overridable on the command line
    argv.source = argv.source || config.source || 'src';
    argv.target = argv.target || config.target || 'gen';
    argv.static = argv.static || config.static || 'static';
    argv.template = argv.template || config.template || 'template';
    argv.extension = argv.extension || config.extension || 'html';
    argv.ignore = argv.ignore || config.ignore || ['**/.*'];

    // args that can only be specified in .anodize.yml
    argv.head = config.head || {};
    argv.head.charset = argv.head.charset || 'utf-8';
    argv.head.raw = argv.head.raw || [];
    argv.head.title = argv.head.title || 'Welcome to Anodize!';
    argv.head.description = argv.head.description || 'A website generated by Anodize, a dead simple static site generator.';
  },
  (argv) => {
    argv.path = {
      source: path.join(argv.input, argv.source),
      target: path.join(argv.input, argv.target),
      static: path.join(argv.input, argv.static),
      yaml: path.join(argv.input, '.anodize.yml'),
      template: path.join(argv.input, argv.template),
    };
  },
  (argv) => {
    if (argv.source === argv.target) {
      throw new Error('ERROR: source and target are same directory. stop.');
    }
  }])
  .commandDir('commands')
  .argv;
