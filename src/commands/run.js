const Liquid = require('liquidjs');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const timer = require('pretty-hrtime');
const minimatch = require('minimatch');
const { serve } = require('./serve');
const render = require('./render/render.js');
const scan = require('./render/scan.js');
const icon = require('./icon.js').handler;

const LiquidEngine = (templateDir) => {
  const engine = new Liquid({
    root: templateDir,
    cache: true,
  });
  engine.registerFilter('dateFormat', (timestamp, format) => moment.unix(timestamp).format(format));
  engine.registerFilter('sortItems', (obj) => {
    const items = {};
    Object.assign(items, obj);
    delete items.index;
    const sortKey = obj.index && obj.index.keys.sortBy ? obj.index.keys.sortBy : 'sort';
    return Object.values(items).sort((a, b) => (b.keys ? b.keys[sortKey] : 0) - (a.keys ? a.keys[sortKey] : 0));
  });
  return engine;
};

exports.command = 'run';
exports.describe = 'run the generator';

exports.builder = {
  drafts: {
    describe: 'include drafts in the site',
    boolean: true,
    default: false,
  },
  serve: {
    describe: 'serve the output',
    boolean: true,
    default: false,
  },
  watch: {
    describe: 'watch and regenerate',
    boolean: true,
    default: false,
  },
};

function loadTemplate(templatePath, engine) {
  return fs.readFile(templatePath, 'utf8')
    .then(f => engine.parse(f));
}

function loadAllTemplates(templatePath, engine) {
  const templates = {};
  return fs.readdir(templatePath)
    .then(ts => Promise.all(ts.map(p => loadTemplate(path.join(templatePath, p), engine)
      .then((t) => { templates[path.basename(p, '.liquid')] = t; }))))
    .then(() => templates);
}

function printTime(s) {
  console.log(`Completed in ${timer(process.hrtime(s))}.`);
}

function shouldIgnore(filename, argv) {
  return argv.ignore.reduce((ret, pattern) => ret || minimatch(filename, pattern), false);
}

exports.handler = function handler(argv) {
  const start = process.hrtime();

  const engine = LiquidEngine(argv.path.template);

  const context = { depList: {} };
  loadAllTemplates(argv.path.template, engine)
    .then((tpls) => {
      context.templates = tpls;
      return loadTemplate(require.resolve('./render/default.liquid'), engine);
    })
    .then((def) => {
      context.templates.default = def;
      return scan.dir(argv.path.source, argv.ignore, argv.drafts, argv.path.source, context.depList);
    })
    .then((res) => {
      context.site = res;
      return render(res, res, engine, argv, context.templates);
    })
    .then(() => printTime(start));

  if (argv.watch) {
    // watch templates
    fs.watch(argv.path.template, (eventType, filename) => {
      // ignore according to rules
      if (shouldIgnore(filename, argv) || path.extname(filename) !== '.liquid') {
        return;
      }

      console.log(`Change in ${filename}, attempting to reload template.`);
      const s = process.hrtime();
      loadTemplate(path.join(argv.path.template, filename), engine)
        .then((tpl) => {
          context.templates[path.basename(filename, '.liquid')] = tpl;
          return render(context.site, context.site, engine, argv, context.templates);
        })
        .then(() => printTime(s));
    });

    // rescan if necessary
    fs.watch(argv.path.source, { recursive: true }, (eventType, filename) => {
      if (shouldIgnore(filename, argv)) { return; }

      console.log(`Change in ${filename}, rescanning.`);
      const s = process.hrtime();
      const pathToFile = filename.split('/');
      let { object } = objectPath(context.site, pathToFile);
      const basename = path.basename(filename, '.md');
      // rescan the file that changed
      scan.file(path.join(argv.path.source, filename), argv.path.source, argv.drafts, context.depList)
        .then((res) => {
          object[basename] = res;
          // regenerate file
          const promises = [render(res, context.site, engine, argv, context.templates)];
          // regenerate dependent files
          let dependents = Object.keys(context.depList).filter(d => context.depList[d]);
          for (let i = 0; i < dependents.length; i++) {
            const { object, key } = objectPath(context.site, dependents[i].split('/').slice(1));
            promises.push(render(object[key], context.site, engine, argv, context.templates));
          }
          console.log(`Regenerated dependent files ${dependents.join(',')}`);
          return Promise.all(promises);
        })
        .then(() => printTime(s));
      })
  }

  if (argv.serve) {
    serve(argv.path.target, 8000);
  }
};

function objectPath(obj, pathToFile) {
  let i = 0;
  for (i = 0; i < pathToFile.length - 1; i++) {
    if (obj && obj[pathToFile[i]]) {
      obj = obj[pathToFile[i]];
    } else {
      break;
    }
  }
  return { object: obj, key: pathToFile[i] };
}
