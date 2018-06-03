'use strict';

const fs = require('fs');
const run = require('./run.js');
const copy = require('./copy.js');
const serve = require('./serve.js');

exports.command = 'watch';
exports.describe = 'Execute the generator each time the source or static directories change';

exports.builder = {
  'no-static': {
    describe: 'Ignore changes in the static file directory',
    boolean: true,
    default: false,
  },
  'no-template': {
    describe: 'Ignore changes in the template directory',
    boolean: true,
    default: false,
  },
  serve: {
    describe: 'Serve HTTP from the target directory on the specified port',
    boolean: true,
    default: false,
  },
  port: {
    describe: 'Port for serving HTTP',
    default: 8000,
  },
};

exports.handler = function handler(argv) {
  if (argv.serve) {
    serve.serve(argv.path.target, argv.port);
  }

  // run it once
  run.handler(argv, true);

  console.log('Watching source directory...');
  if (!argv['no-static']) {
    fs.watch(argv.path.static, { recursive: true }, (eventType, filename) => {
      console.log(`Change in ${filename}, recopying...`);
      copy.handler(argv);
    });
  }

  if (!argv['no-template']) {
    fs.watch(argv.path.template, { recursive: true }, (eventType, filename) => {
      console.log(`Change in ${filename}, regenerating...`);
      run.handler(argv, false);
    });
  }

  fs.watch(argv.path.source, { recursive: true }, (eventType, filename) => {
    console.log(`Change in ${filename}, regenerating...`);
    run.handler(argv, false);
  });
};
