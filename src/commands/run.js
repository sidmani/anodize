'use strict';

const fs = require('fs-extra');
const path = require('path');
const showdown = require('showdown');
const copy = require('./copy.js');
const Liquid = require('liquidjs');
const { parse } = require('./parse.js');
const minimatch = require('minimatch');

const defaultTemplate = fs.readFileSync(require.resolve('../default.liquid'), 'utf8');

const converter = new showdown.Converter();
const LiquidEngine = (templateDir) => {
  const engine = new Liquid({
    root: templateDir,
  });
  engine.registerFilter('markdown', md => converter.makeHtml(md));
  return engine;
};

function scan(directory, ignore = [], root) {
  let base = [];
  const baseID = (directory === root) ? '_root' : path.basename(directory);

  fs.readdirSync(directory)
    .filter(p => ignore.reduce((ret, pattern) => ret && !minimatch(p, pattern), true))
    .forEach((p) => {
      const filePath = path.join(directory, p);
      const lstat = fs.lstatSync(filePath);
      let object;
      if (lstat.isDirectory()) {
        // recursively scan directories
        object = scan(filePath, ignore, root);
        base.push(object);
        base[path.basename(p)] = object;
      } else if (lstat.isFile()) {
        if (filePath.slice(-3) === '.md') {
          // markdown file
          const file = fs.readFileSync(filePath, 'utf8');
          object = parse(file);
          // {id}.md
          object.id = path.basename(p).slice(0, -3);
          if (object.id !== 'index') {
            object.path = path.join('/', path.relative(root, directory), object.id);
            base.push(object);
            object.layout = object.layout || baseID + '.liquid';
          } else {
            // the path of the index is the parent folder
            object.path = path.join('/', path.relative(root, directory)) + '/';
            object.layout = object.layout || 'index.liquid';
            // index files are not included in the array
          }

          object.directory = baseID;
        } else {
          // non-markdown file
          object = {
            id: path.basename(p),
            path: path.join('/', path.relative(root, directory), path.basename(p)),
          };

          base.push(object);
        }
        base[object.id] = object;
      }
    });

  base = base.sort((a, b) => {
    let sortA = 0;
    let sortB = 0;
    if (Array.isArray(a)) {
      sortA = a.index ? a.index.sort : 0;
    } else {
      sortA = a.sort || 0;
    }

    if (Array.isArray(b)) {
      sortB = b.index ? b.index.sort : 0;
    } else {
      sortB = b.sort || 0;
    }
    return sortB - sortA;
  });

  return base;
}

function renderFile(object, site, engine, argv, indexify, currentDir) {
  try {
    const template = fs.readFileSync(path.join(argv.path.template, object.layout), 'utf8');
    engine.parseAndRender(object.body, {
      site,
      object,
      current: currentDir,
      global: argv.global,
    })
      .then((body) => {
        object.body = converter.makeHtml(body);
        return engine.parseAndRender(template, {
          site,
          object,
          current: currentDir,
          global: argv.global,
        });
      })
      .then(res => engine.parseAndRender(defaultTemplate, {
        head: argv.head,
        doc: res,
      }))
      .then((html) => {
        if (indexify) {
          fs.outputFileSync(path.join(argv.path.target, object.path, 'index.html'), html);
        } else {
          if (object.id === 'index') {
            fs.outputFileSync(path.join(argv.path.target, object.path, 'index.html'), html);
          } else {
            fs.outputFileSync(path.join(argv.path.target, `${object.path}.html`), html);
          }
        }
      })
      .catch(console.log);
  } catch (e) {
    console.log('Warning: could not find template ' + object.layout);
  }
}

function renderDir(base, site, engine, argv, indexify) {
  base.forEach((object, idx) => {
    if (Array.isArray(object)) {
      // object is directory
      renderDir(object, site, engine, argv, indexify);
    } else if (object.layout) {
      // object is markdown
      object.idx = idx;
      renderFile(object, site, engine, argv, indexify, base);
    } else if (!argv['no-static']) {
      // object is static file
      fs.copySync(
        path.join(argv.path.source, object.path),
        path.join(argv.path.target, object.path),
      );
    }
  });

  if (base.index) {
    renderFile(base.index, site, engine, argv, false, base);
  }
}

exports.command = 'run';
exports.describe = 'run the generator';

exports.builder = {
  'no-static': {
    describe: 'skip the static copy phase',
    boolean: true,
    default: false,
  },
  indexify: {
    describe: 'create each non-index file as the index of its own directory, allowing access as /file/ instead of /file.html',
    boolean: true,
    default: false,
  },
};

exports.handler = function handler(argv) {
  if (!argv['no-static']) {
    copy.handler(argv);
  }
  const site = scan(argv.path.source, argv.ignore, argv.path.source);
  const engine = LiquidEngine(argv.path.template);
  renderDir(site, site, engine, argv, argv.indexify);
};
