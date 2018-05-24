'use strict';

const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');

exports.command = 'copy';
exports.aliases = ['cp'];
exports.describe = 'Copy static files into the target directory'

exports.handler = function(argv) {
  if (fs.existsSync(argv.path.static)) {
    fs.copySync(argv.path.static, argv.path.target, {
      filter: function(src, dest) {
        let ret = true;
        argv.ignore.forEach(pattern => {
          if (minimatch(src, pattern)) {
            ret = false;
          }
        });
        return ret;
      }
    });
  }
}