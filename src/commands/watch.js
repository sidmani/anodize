'use strict';

const fs = require('fs');
const run = require('./run.js');
const copy = require('./copy.js');

exports.command = 'watch';
exports.describe = 'Execute the generator each time the source or static directories change';

exports.builder = {
  'no-static': {
    describe: 'Ignore changes in the static file directory',
    boolean: true,
    default: false,
  },
};

exports.handler = function handler(argv) {
  console.log(`Watching source directory...`)
  if (!argv['no-static']) {
    fs.watch(argv.path.static, { recursive: true }, (eventType, filename) => {
      console.log('Change in ' + filename + ', recopying...');
      copy.handler(argv);
    });
  }
  fs.watch(argv.path.source, { recursive: true }, (eventType, filename) => {
    console.log('Change in ' + filename + ', regenerating...');
    run.handler(argv);
  });
};
