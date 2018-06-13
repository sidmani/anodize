'use strict';

const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');
const parse = require('./parse.js');
const sort = require('./sort.js');

const imageExtensions = new Set(['.jpeg', '.jpg', '.JPG', '.JPEG', '.png', '.PNG']);

function scanFile(filePath, root) {
  const extension = path.extname(filePath);
  const directory = path.dirname(filePath);
  const object = {
    path: path.join('/', path.relative(root, directory), path.basename(filePath, '.md')),
    dirname: directory === root ? '_root' : path.basename(directory),
    id: path.basename(filePath, '.md'),
  };

  if (object.path.slice(-5) === 'index') {
    object.path = object.path.slice(0, -5);
  }

  if (extension === '.md') {
    // markdown file
    Object.assign(object, parse(filePath));
  } else if (imageExtensions.has(extension)) {
    // image file
    object.type = 'image';
  } else {
    object.type = extension.slice(1);
  }

  return object;
}

module.exports = function scan(directory, ignore = [], root = directory) {
  const base = [];

  fs.readdirSync(directory)
    .filter(p => ignore.reduce((ret, pattern) => ret && !minimatch(p, pattern), true))
    .forEach((p) => {
      const filePath = path.join(directory, p);
      const lstat = fs.lstatSync(filePath);
      if (lstat.isDirectory()) {
        // recursively scan directories
        const dir = scan(filePath, ignore, root);
        base.push(dir);
        base[path.basename(p)] = dir;
      } else if (lstat.isFile()) {
        const file = scanFile(filePath, root);
        file.directory = base;
        if (file.type !== 'index') {
          base.push(file);
        }
        base[file.id] = file;
      }
    });

  return sort(base);
};
