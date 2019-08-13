const fs = require('fs-extra');
const path = require('path');
const mathjax = require('mathjax-node-page').mjpage;
const conv = require('./converters');

const defaultLocation = require.resolve('./default.liquid');

const markdown = conv.markdown();
let engine;

function renderFile(object, site, argv) {
  if (!engine) {
    engine = conv.liquid(argv.path.template);
  }

  if (argv['hide-drafts']) {
    if (!object.keys.draft) { return Promise.reject(); }
    console.log(`Draft ${object.keys.title} located at ${object.hash}`);
    object.path = object.hash;
  }
  const layout = object.keys.layout || (object.id === 'index.md' ? 'index' : object.dirname);

  // override head parameters from document
  const head = {};
  Object.assign(head, argv.head);
  head.title = argv.titleTemplate ? argv.titleTemplate.replace('$0', object.keys.title) : object.keys.title;
  Object.assign(head, object.keys.head);
  if (object.keys.keywords) {
    head.keywords = object.keys.keywords;
  }

  const params = {
    keys: object.keys,
    global: argv.global,
    id: object.id,
    path: object.path,
    dirname: object.dirname,
  };

  if (object.keys.regen || (object.id === 'index.md' && !object.keys['no-regen'])) {
    params.site = site;
  }

  // run liquid on object body
  return engine.parseAndRender(object.body, params)
  // convert markdown to html
    .then(body => markdown.makeHtml(body))
  // handle LaTeX
    .then((body) => {
      if (object.keys.math) {
        return new Promise((resolve) => {
          mathjax(body, { format: ['TeX'], singleDollars: true, output: 'html' }, {}, o => resolve(o));
        });
      }
      return body;
    })
  // Liquid on entire document and template
    .then((html) => {
      params.html = html;
      return engine.renderFile(layout, params);
    })
  // Liquid on html and default template with <head>
    .then(doc => engine.renderFile(defaultLocation, { head, doc }))
  // output the file
    .then(html => fs.outputFile(path.join(argv.path.target, object.outputPath), html))
    .catch(console.log);
}

module.exports = function render(base, site, argv) {
  if (typeof base.body === 'string') {
    // base is markdown
    return renderFile(base, site, argv);
  }

  // base is static file
  return fs.copy(
    path.join(argv.path.source, base.path),
    path.join(argv.path.target, base.path),
  );
};
