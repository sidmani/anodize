'use strict';

const ls = require('live-server');

exports.command = 'serve';
exports.aliases = ['s'];
exports.describe = 'Serve files over HTTP from the target directory';
exports.builder = {
  port: {
    describe: 'Port for serving HTTP',
    default: 8000,
  },
};
exports.serve = function serve(target, port) {
  console.log('Serving HTTP from ' + target + '/ at localhost:' + port + '...');
  ls.start({
    port,
    root: target,
    open: false,
    wait: 500,
    logLevel: 0,
  });
};

exports.handler = function handler(argv) {
  exports.serve(argv.path.target, argv.port);
};
