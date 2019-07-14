const showdown = require('showdown');
const Liquid = require('liquidjs');
const scan = require('./scan/scan.js');
const render = require('./render/render.js');
const icon = require('./icon.js').handler;
const moment = require('moment');

const converter = new showdown.Converter();
const LiquidEngine = (templateDir) => {
  const engine = new Liquid({
    root: templateDir,
  });
  engine.registerFilter('dateFormat', (timestamp, format) => moment.unix(timestamp).format(format));
  return engine;
};

exports.command = 'run';
exports.describe = 'run the generator';

exports.builder = {
  'no-static': {
    describe: 'skip copying static files',
    boolean: true,
    default: false,
  },
  indexify: {
    describe: 'create each non-index file as the index of its own directory, allowing access as /file/ instead of /file.html',
    boolean: true,
    default: false,
  },
  drafts: {
    describe: 'include drafts in the site',
    boolean: true,
    default: false,
  },
};

exports.handler = function handler(argv) {
  const engine = LiquidEngine(argv.path.template);
  // scan the directory and construct the structure
  const site = scan(argv.path.source, argv.ignore, argv.drafts);

  // render the object structure into the target directory
  render(site, site, engine, argv);
  if (argv.icon) {
    icon(argv);
  }
};
