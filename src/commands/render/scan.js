const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const yaml = require('js-yaml');
const read = require('recursive-readdir');
const crypto = require('crypto');

function hash(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

module.exports.file = function scanFile(filePath, root, drafts) {
  const directory = path.relative(root, path.dirname(filePath));
  const basename = path.basename(filePath);
  const object = {
    path: path.join('/', directory, path.basename(filePath, '.md')),
    id: basename,
    dirname: (directory === '') ? '_root' : path.basename(directory),
    directory,
  };

  if (path.extname(filePath) === '.md') {
    object.outputPath = object.id === 'index.md' ? `${object.path}.html` : path.join(object.path, 'index.html');
    // markdown file
    return fs.readFile(filePath, 'utf-8')
      .then((file) => {
        object.hash = hash(file);
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

        object.regen = object.keys.regen || (object.id === 'index.md' && !object.keys['no-regen']);

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
          ['YYYY-M', 'YYYY-MM-DD'],
        ).unix() || object.keys.date;
        return object;
      });
  }
  object.outputPath = object.path;
  object.hash = object.id;
  return Promise.resolve(object);
};

module.exports.dir = function scan(filePath, ignore = [], drafts) {
  const base = {};
  return read(filePath, ignore)
    .then(files => Promise.all(files.map(p => module.exports.file(p, filePath, drafts)
      .then((obj) => {
        if (!obj) return;
        if (!base[obj.directory]) { base[obj.directory] = {}; }
        base[obj.directory][obj.id] = obj;
      }))))
    .then(() => base);
};
