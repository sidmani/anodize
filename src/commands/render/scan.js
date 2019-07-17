const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');
const moment = require('moment');
const yaml = require('js-yaml');

function scanFile(filePath, root) {
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

        object.keys.date = moment(
          object.keys.date,
          ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm'],
        ).unix() || object.keys.date;
        return object;
      });
  }

  return Promise.resolve(object);
}

module.exports = function scan(filePath, ignore = [], drafts, root = filePath, depList) {
  return fs.lstat(filePath)
    .then((stat) => {
      if (stat.isDirectory()) {
        const base = {};
        // recursively scan directories
        return fs.readdir(filePath)
          .then((files) => {
            const promises = files
              .filter(p => ignore.reduce((ret, pattern) => ret && !minimatch(p, pattern), true))
              .map((p) => scan(path.join(filePath, p), ignore, drafts, root, depList).then((o) => {
                if (o) base[path.basename(p, '.md')] = o;
              }));
            return Promise.all(promises).then(() => base);
          });
     }

      return scanFile(filePath, root).then((obj) => {
        if (typeof obj.body !== 'string') { return obj; }
        if (obj.keys.regen || (obj.id === 'index' && !obj.keys['no-regen'])) {
          depList.site[obj.path] = true;
        } else {
          depList.site[obj.path] = false;
        }

        // refuse to render drafts
        if (obj.keys.draft) {
          if (!drafts) { return; }

          // modify title of drafts
          if (obj.keys.title) {
            if (!obj.keys.head) obj.keys.head = {};
            // browser window title
            obj.keys.head.title = obj.keys.title + ' [DRAFT]';
            // title on page and anywhere else
            obj.keys.title += ' <strong style="color:red;">[DRAFT]</strong>';
          }
        }
        return obj;
      });
    });
};
