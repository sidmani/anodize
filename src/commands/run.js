const fs = require('fs-extra');
const timer = require('pretty-hrtime');
const read = require('recursive-readdir');
const render = require('./render/render');
const scan = require('./render/scan');
const conv = require('./render/converters');

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
  const converters = {
    liquid: conv.liquid(argv.path.template),
    markdown: conv.markdown(),
  };
  read(argv.path.source, argv.ignore)
    .then(paths => Promise.all(paths
      // ignore drafts if necessary
      .filter(p => argv.drafts || p.slice(-9) !== '.draft.md')
      // scan each file
      .map(p => scan(p, argv.path.source))))
    // render selectively based on cache
    .then(objects => Promise.all(objects
      .filter(f => (f.keys && f.keys.regen)
        || !cache.root[f.outputPath]
        || cache.root[f.outputPath].hash !== f.hash)
      .map((f) => {
        cache.root[f.outputPath] = { hash: f.hash };
        return render(f, objects, argv, converters);
      })))
    .then(() => fs.outputJson(argv.path.cache, cache))
    .then(() => console.log(`Completed in ${timer(process.hrtime(start))}.`));
};
