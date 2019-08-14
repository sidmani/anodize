#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadConfig(argv) {
  let config = {};
  try {
    config = yaml.safeLoad(fs.readFileSync(path.join(argv.input, '.anodize.yml'), 'utf8'));
  } catch (e) {
    throw new Error('Could not load .anodize.yml, exiting...');
  }
  /* eslint-disable no-param-reassign */
  // args that are overridable on the command line
  argv.source = argv.source || config.source || 'src';
  argv.target = argv.target || config.target || 'gen';

  // args that can only be specified in .anodize.yml
  argv.template = config.template || 'template';
  argv.ignore = config.ignore || ['**/.*'];
  argv.icon = config.icon;
  argv.global = config.global || {};
  argv.titleTemplate = config.titleTemplate;
  argv.head = config.head || {};
  argv.head.charset = config.head.charset || 'utf-8';
  argv.head.raw = config.head.raw || [];
  argv.head.description = config.head.description || 'A website generated by Anodize, a minimalist static site generator.';

  argv.path = {
    cache: path.join(argv.input, '.anodize_cache.json'),
    source: path.join(argv.input, argv.source),
    target: path.join(argv.input, argv.target),
    template: path.join(argv.input, argv.template),
  };

  if (argv.source === argv.target) {
    throw new Error('ERROR: source and target are same directory. stop.');
  }
}

const yargs = require('yargs')
  .option('input', {
    alias: ['i'],
    describe: 'Set the working directory',
    default: '.',
  })
  .option('source', {
    alias: ['s'],
    describe: 'The directory containing source files',
  })
  .option('target', {
    alias: ['t'],
    describe: 'The directory in which to store generated files',
  })
  .option('template', {
    describe: 'The directory containing template files',
  })
  .middleware([(argv) => {
    loadConfig(argv);
  }])
  .commandDir('commands')
  .argv;

const run = require('./commands/run');

module.exports.run = function e(argv) {
  loadConfig(argv);
  run.handler(argv);
};
