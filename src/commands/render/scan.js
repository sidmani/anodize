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
    const file = fs.readFileSync(filePath, 'utf-8');
    // split the header and body by the first --- in the file
    const parsed = /^([\W\w]+?)\n---\n([\W\w]*)/g.exec(file);
    if (parsed && parsed[1]) {
      // parse the keys from the YAML header
      Object.assign(object, yaml.safeLoad(parsed[1]));
      // set the body of the file
      object.body = parsed[2];
    } else {
      throw new Error(`${filePath} is not a valid markdown file!`);
    }

    object.date = moment(object.date, ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm']).unix() || object.date;
  }

  return object;
}

module.exports = function scan(filePath, ignore = [], drafts, root = filePath, depList) {
  let stat;
  try {
    stat = fs.lstatSync(filePath);
  } catch (e) {
    return;
  }

  if (stat.isDirectory()) {
    const base = {};
    // recursively scan directories
    fs.readdirSync(filePath)
      .filter(p => ignore.reduce((ret, pattern) => ret && !minimatch(p, pattern), true))
      .forEach((p) => {
        const obj = scan(path.join(filePath, p), ignore, drafts, root, depList);
        if (obj) {
          base[path.basename(p, '.md')] = obj;
        }
      });
    return base;
  }

  const obj = scanFile(filePath, root);
  if (obj.include) {
    depList.site[obj.path] = obj.include.site;
  }

  // refuse to render drafts
  if (obj.draft) {
    if (!drafts) { return; }

    // modify title of drafts
    if (obj.title) {
      if (!obj.head) obj.head = {};
      // browser window title
      obj.head.title = obj.title + ' [DRAFT]';
      // title on page and anywhere else
      obj.title += ' <strong style="color:red;">[DRAFT]</strong>';
    }
  }
  return obj;
};
