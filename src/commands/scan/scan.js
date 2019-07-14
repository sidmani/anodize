const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');
const parse = require('./parse.js');

const imageExtensions = new Set(['.jpeg', '.jpg', '.JPG', '.JPEG', '.png', '.PNG']);

function scanFile(filePath, root) {
  const extension = path.extname(filePath);
  const directory = path.dirname(filePath);
  const object = {
    path: path.join('/', path.relative(root, directory), path.basename(filePath, '.md')),
    dirname: directory === root ? '_root' : path.basename(directory),
    id: path.basename(filePath),
  };

  if (extension === '.md') {
    // markdown file
    Object.assign(object, parse(filePath));
    if (object.path.slice(-5) === 'index') {
      object.path = object.path.slice(0, -5);
    }
  } else if (imageExtensions.has(extension)) {
    // image file
    object.type = 'image';
  } else {
    object.type = extension.slice(1);
  }

  return object;
}

function sortValue(object, sortKey) {
  if (Array.isArray(object)) {
    return object.index && object.index[sortKey] ? object.index[sortKey] : 0;
  }

  return object[sortKey] || 0;
}

module.exports = function scan(filePath, ignore = [], drafts, root = filePath) {
  if (fs.lstatSync(filePath).isDirectory()) {
    const base = [];
    // recursively scan directories
    fs.readdirSync(filePath)
      .filter(p => ignore.reduce((ret, pattern) => ret && !minimatch(p, pattern), true))
      .forEach((p) => {
        const obj = scan(path.join(filePath, p), ignore, drafts, root);
        // refuse to render drafts
        if (obj.draft) {
          if (!drafts) {
            return;
          }

          // modify title of drafts
          if (obj.title) {
            if (!obj.head) obj.head = {};
            obj.head.title = obj.title + ' [DRAFT]';
            obj.title += ' <strong style="color:red;">[DRAFT]</strong>';
          }
        }

        if (obj.type !== 'index') {
          base.push(obj);
        }
        if (!Array.isArray(obj)) {
          obj.directory = base;
        }
        base[path.basename(p, '.md')] = obj;
      });

    const sortKey = base.index && base.index.sortBy ? base.index.sortBy : 'sort';

    return base.sort((a, b) => sortValue(b, sortKey) - sortValue(a, sortKey));
  }

  return scanFile(filePath, root);
};
