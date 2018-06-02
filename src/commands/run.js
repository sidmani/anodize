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
  const base = [];
  base.directories = [];
  base.files = [];
  base.id = (directory === root) ? '_root' : path.basename(directory);

  fs.readdirSync(directory)
    .filter(p => ignore.reduce((ret, pattern) => ret && !minimatch(p, pattern), true))
    .forEach((p) => {
      const filePath = path.join(directory, p);
      const lstat = fs.lstatSync(filePath);
      let object;
      if (lstat.isDirectory()) {
        object = scan(filePath, ignore, root);
        base.directories.push(object);
      } else if (lstat.isFile()) {
        const file = fs.readFileSync(filePath, 'utf8');
        object = parse(file);
        object.id = path.basename(p).slice(0, -3);
        if (object.id !== 'index') {
          base.files.push(object);
        }

        if (!object.layout) {
          object.layout = object.id === 'index' ? 'index.t' : base.id + '.t';
        }
      }

      object.directory = base.id;
      object.path = path.join('/', path.relative(root, directory), object.id);
      base[object.id] = object;
    });

  base.sort = base.index ? base.index.sort : 0;
  base.files = base.files.sort((a, b) => (b.sort || 0) - (a.sort || 0));
  base.directories = base.directories.sort((a, b) => (b.sort || 0) - (a.sort || 0));
  return base;
}

function renderFile(object, site, engine, argv, indexify) {
  try {
    const template = fs.readFileSync(path.join(argv.path.template, object.layout), 'utf8');
    engine.parseAndRender(object.body, { site, object })
      .then((body) => {
        object.body = converter.makeHtml(body);
        return engine.parseAndRender(template, {
          site,
          object,
        });
      })
      .then(res => engine.parseAndRender(defaultTemplate, {
        head: argv.head,
        doc: res,
      }))
      .then((html) => {
        if (indexify) {
          fs.outputFileSync(path.join(argv.path.target, object.path, `index.${argv.extension}`), html);
        } else {
          fs.outputFileSync(path.join(argv.path.target, `${object.path}.${argv.extension}`), html);
        }
      })
      .catch(console.log);
  } catch (e) {
    console.log('Warning: could not find template ' + object.layout);
  }
}

function renderDir(base, site, engine, argv, indexify) {
  base.files.forEach((object) => {
    renderFile(object, site, engine, argv, indexify);
  });

  base.directories.forEach((folder) => {
    renderDir(folder, site, engine, argv, indexify);
  });

  if (base.index) {
    renderFile(base.index, site, engine, argv, false);
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

exports.handler = function handler(argv, shouldCopy = true) {
  if (!argv['no-static'] && shouldCopy) {
    copy.handler(argv);
  }
  const site = scan(argv.path.source, argv.ignore, argv.path.source);
  const engine = LiquidEngine(argv.path.template);
  renderDir(site, site, engine, argv, argv.indexify);
};
