const fs = require('fs-extra');
const path = require('path');
const showdown = require('showdown');
const mathjax = require('mathjax-node-page').mjpage;
const extensions = require('./extensions');

const converter = new showdown.Converter({ extensions });

function renderFile(object, site, engine, argv, templates) {
  const layout = object.keys.layout || (object.id === 'index' ? 'index' : object.dirname);
  const template = templates[layout];
  if (!template) {
    return Promise.reject(new Error('Warning: could not find template ' + object.layout));
  }

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

  if (object.keys.regen || (object.id === 'index' && !object.keys['no-regen'])) {
    params.site = site;
  }

  // run liquid on object body
  return engine.parseAndRender(object.body, params)
  // convert markdown to html
    .then(body => converter.makeHtml(body))
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
      return engine.render(template, params);
    })
  // Liquid on html and default template with <head>
    .then(res => engine.render(templates.default, {
      head,
      doc: res,
    }))
  // output the file
    .then((html) => {
      if (object.id === 'index') {
        return fs.outputFile(path.join(argv.path.target, object.path + '.html'), html);
      } else {
        return fs.outputFile(path.join(argv.path.target, object.path, 'index.html'), html);
      }
    })
    .catch(console.log);
}

module.exports = function render(base, site, engine, argv, templates) {
  if (typeof base.body === 'string') {
    // base is markdown
    return renderFile(base, site, engine, argv, templates);
  } else if (base.id) {
    // base is static file
    return fs.copy(
      path.join(argv.path.source, base.path),
      path.join(argv.path.target, base.path),
    );
  }
  // object is directory
  return Promise.all(Object.values(base).map(o => render(o, site, engine, argv, templates)));
};
