'use strict'

const fs = require('fs');
const config = require('./config.js');

exports.command = 'clean';
exports.describe = 'delete all generated files';
exports.builder = {};

exports.handler = function(argv) {

}

exports.deleteRecursively = function(path) {
  fs.readdirSync(directory)
    .forEach(object => {
      const lstat = fs.lstatSync(object);
      if (lstat.isDirectory()) {
        deleteRecursively(object);
      } else if (lstat.isFile()) {
        fs.unlinkSync(f);
      }
    })
}
