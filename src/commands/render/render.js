const fs = require('fs-extra');
const path = require('path');
const mathjax = require('mathjax-node-page').mjpage;

const defaultLocation = require.resolve('./default.liquid');

function renderFile(object, site, argv, conv) {
  if (argv['hide-drafts']) {
    if (!object.keys.draft) { return Promise.reject(); }
    console.log(`Draft ${object.keys.title} located at ${object.hash}`);
    object.outputPath = object.hash;
  }
  const dirname = object.directory === '' ? '_root' : path.basename(object.directory);
  const layout = object.keys.layout || (object.id === 'index.md' ? 'index' : dirname);

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
    directory: object.directory,
  };

  if (object.keys.regen) {
    params.site = site;
  }

  // run liquid on object body
  return conv.liquid.parseAndRender(object.body, params)
  // convert markdown to html
    .then(body => conv.markdown.makeHtml(body))
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
      return conv.liquid.renderFile(layout, params);
    })
  // Liquid on html and default template with <head>
    .then(doc => conv.liquid.renderFile(defaultLocation, { head, doc }))
  // output the file
    .then(html => fs.outputFile(path.join(argv.path.target, object.outputPath), html))
    .catch(console.log);
}

module.exports = function render(base, site, argv, conv) {
  if (typeof base.body === 'string') {
    // base is markdown
    return renderFile(base, site, argv, conv);
  }

  // base is static file
  return fs.copy(
    path.join(argv.path.source, base.path),
    path.join(argv.path.target, base.path),
  );
};
