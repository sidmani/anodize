const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const yaml = require('js-yaml');
const read = require('recursive-readdir');

module.exports.file = function scanFile(filePath, root, drafts, depList) {
  const directory = path.dirname(filePath);
  const basename = path.basename(filePath, '.md');
  const object = {
    path: path.join('/', path.relative(root, directory), basename),
    id: basename,
    dirname: (path.basename(directory) === path.basename(root)) ? '_root' : path.basename(directory),
  };

  if (path.extname(filePath) === '.md') {
    // markdown file
    return fs.readFile(filePath, 'utf-8')
      .then((file) => {
        // split the header and body by the first --- in the file
        const parsed = /^([\W\w]+?)\n---\n([\W\w]*)/g.exec(file);
        if (parsed && parsed[1]) {
          // parse the keys from the YAML header
          object.keys = yaml.safeLoad(parsed[1]);
          // set the body of the file
          object.body = parsed[2];
        } else {
          throw new Error(`${filePath} is not a valid markdown file!`);
        }

        if (typeof object.body === 'string') {
          depList[object.path] = object.keys.regen || (object.id === 'index' && !object.keys['no-regen']);
        }

        if (object.keys.draft) {
          if (!drafts) { return; }

          // modify title of drafts
          if (object.keys.title) {
            if (!object.keys.head) object.keys.head = {};
            // browser window title
            object.keys.head.title = object.keys.title + ' [DRAFT]';
            // title on page and anywhere else
            object.keys.title += ' <strong style="color:red;">[DRAFT]</strong>';
          }
        }

        object.keys.date = moment(
          object.keys.date,
          ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm'],
        ).unix() || object.keys.date;
        return object;
      });
  }

  return Promise.resolve(object);
}

function assignAtPath(base, assign) {
  const keys = assign.path.split('/').slice(1);
  let o = base;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!o[keys[i]]) o[keys[i]] = {};
    o = o[keys[i]];
  }
  o[keys[keys.length - 1]] = assign;
}

module.exports.dir = function scan(filePath, ignore = [], drafts, root = filePath, depList) {
  const base = {};
  return read(filePath, ignore)
    .then(files => Promise.all(files.map(p => module.exports.file(p, root, drafts, depList)
      .then(obj => obj && assignAtPath(base, obj)))))
    .then(() => base);
};
