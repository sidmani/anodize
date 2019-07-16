const Liquid = require('liquidjs');
const fs = require('fs-extra');
const path = require('path');
const scan = require('./render/scan.js');
const render = require('./render/render.js');
const icon = require('./icon.js').handler;
const moment = require('moment');
const timer = require('pretty-hrtime');
const minimatch = require('minimatch');
const serve = require('./serve').serve;

const LiquidEngine = (templateDir) => {
  const engine = new Liquid({
    root: templateDir,
  });
  engine.registerFilter('dateFormat', (timestamp, format) => moment.unix(timestamp).format(format));
  engine.registerFilter('sortItems', (obj) => {
    const items = {};
    Object.assign(items, obj);
    delete items.index;
    const sortKey = obj.index && obj.index.sortBy ? obj.index.sortBy : 'sort';
    return Object.values(items).sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
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
  try {
    const tpl = fs.readFileSync(templatePath, 'utf8');
    return engine.parse(tpl);
  } catch (e) {
    console.log(e);
    return;
  }
}

function loadAllTemplates(templatePath, engine) {
  const templates = {};
  fs.readdirSync(templatePath)
    .forEach((p) => {
      templates[path.basename(p, '.liquid')] = loadTemplate(path.join(templatePath, p), engine);
    });
  return templates;
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
  const context = { depList: { site: {} } };
  context.templates = loadAllTemplates(argv.path.template, engine);
  context.site = scan(argv.path.source, argv.ignore, argv.drafts, argv.path.source, context.depList);
  render(context.site, context.site, engine, argv, context.templates);

  printTime(start);

  if (argv.watch) {
    // watch templates
    fs.watch(argv.path.template, (eventType, filename) => {
      // ignore according to rules
      if (shouldIgnore(filename, argv) || path.extname(filename) !== '.liquid') {
        return;
      }

      console.log(`Change in ${filename}, attempting to reload template.`);
      const s = process.hrtime();
      context.templates[path.basename(filename, '.liquid')] = loadTemplate(path.join(argv.path.template, filename), engine);
      render(context.site, context.site, engine, argv, context.templates);
      printTime(s);
    });

    // rescan if necessary
    fs.watch(argv.path.source, { recursive: true },  (eventType, filename) => {
      if (shouldIgnore(filename, argv)) { return; }

      console.log(`Change in ${filename}, rescanning.`);
      const s = process.hrtime();
      const pathToFile = filename.split('/');
      let { object } = objectPath(context.site, pathToFile);
      const basename = path.basename(filename, '.md');
      // rescan the file that changed
      object[basename] = scan(path.join(argv.path.source, filename), argv.ignore, argv.drafts, argv.path.source, context.depList);

      // regenerate file
      render(object[basename], context.site, engine, argv, context.templates);
      // regenerate dependent files
      let dependents = Object.keys(context.depList.site).filter(d => context.depList.site[d]);
      for (let i = 0; i < dependents.length; i++) {
        const { object, key } = objectPath(context.site, dependents[i].split('/').slice(1));
        render(object[key], context.site, engine, argv, context.templates);
      }
      console.log(`Regenerated dependent files ${dependents.join(',')}`);
      printTime(s);
    });
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
