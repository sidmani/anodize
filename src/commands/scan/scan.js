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
    id: path.basename(filePath),
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

module.exports = function scan(filePath, ignore = [], root = filePath) {
  if (fs.lstatSync(filePath).isDirectory()) {
    const base = [];
    // recursively scan directories
    fs.readdirSync(filePath)
      .filter(p => ignore.reduce((ret, pattern) => ret && !minimatch(p, pattern), true))
      .forEach((p) => {
        const obj = scan(path.join(filePath, p), ignore, root);
        if (obj.type !== 'index') {
          base.push(obj);
        }
        if (!Array.isArray(obj)) {
          obj.directory = base;
        }
        base[path.basename(p, '.md')] = obj;
      });
    return sort(base);
  }

  return scanFile(filePath, root);
};
