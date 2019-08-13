const fs = require('fs-extra');
const timer = require('pretty-hrtime');
const render = require('./render/render');
const scan = require('./render/scan');

exports.command = 'run';
exports.describe = 'run the generator';

exports.builder = {
  drafts: {
    describe: 'include drafts in the site',
    boolean: true,
    default: false,
  },
};

exports.handler = function handler(argv) {
  const start = process.hrtime();

  let cache;
  try {
    cache = fs.readJsonSync(argv.path.cache);
  } catch (e) {
    console.log('Could not load cache!');
    cache = { root: {}, templates: {} };
  }
  scan.dir(argv.path.source, argv.ignore, argv.drafts)
    .then(res => Promise.all(Object.values(res)
      .flatMap(dir => Object.values(dir))
      .filter(f => f.regen
        || !cache.root[f.outputPath]
        || cache.root[f.outputPath].hash !== f.hash)
      .map((f) => {
        cache.root[f.outputPath] = { hash: f.hash };
        return render(f, res, argv);
      })))
    .then(() => fs.outputJson(argv.path.cache, cache))
    .then(() => console.log(`Completed in ${timer(process.hrtime(start))}.`));
};
