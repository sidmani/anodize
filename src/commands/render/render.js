const fs = require('fs-extra');
const path = require('path');
const showdown = require('showdown');
const mathjax = require('mathjax-node-page').mjpage;
const extensions = require('./extensions');

const defaultTemplate = fs.readFileSync(require.resolve('./default.liquid'), 'utf8');
const converter = new showdown.Converter({ extensions });

function renderFile(object, site, engine, argv, currentDir, templates) {
  const dirname = path.basename(path.dirname(object.path));
  const layout = object.layout || (object.id === 'index' ? 'index' : dirname);
  const template = templates[layout];
  if (!template) {
    console.log('Warning: could not find template ' + object.layout);
    return;
  }

  // override head parameters from document
  const head = {};
  Object.assign(head, argv.head);
  Object.assign(head, object.head);
  if (!head.title) {
    head.title = argv.titleTemplate ? argv.titleTemplate.replace('$0', object.title) : object.title;
  }

  const params = { object, global: argv.global };
  if (object.include && object.include.site) {
    params.site = site;
  }

  // run liquid on object body
  engine.parseAndRender(object.body, params)
  // convert markdown to html
    .then(body => converter.makeHtml(body))
  // handle LaTeX
    .then((body) => {
      if (object.math) {
        return new Promise((resolve) => {
          mathjax(body, { format: ['TeX'], singleDollars: true, output: 'html' }, {}, o => resolve(o));
        });
      }
      return body;
    })
  // Liquid on entire document and template
    .then((body) => {
      const o = {};
      Object.assign(o, object);
      o.body = body;
      return engine.render(template, {
        object: o,
        global: argv.global,
      });
    })
  // Liquid on html and default template with <head>
    .then(res => engine.parseAndRender(defaultTemplate, {
      head,
      doc: res,
    }))
  // output the file
    .then((html) => {
      if (object.id === 'index') {
        fs.outputFileSync(path.join(argv.path.target, object.path + '.html'), html);
      } else {
        fs.outputFileSync(path.join(argv.path.target, object.path, 'index.html'), html);
      }
    })
    .catch(console.log);
}

module.exports = function render(base, site, engine, argv, templates) {
  if (typeof base.body === 'string') {
    // base is markdown
    renderFile(base, site, engine, argv, base, templates);
  } else if (base.id) {
    // base is static file
    fs.copySync(
      path.join(argv.path.source, base.path),
      path.join(argv.path.target, base.path),
    );
  } else {
    // object is directory
    Object.values(base).forEach(o => render(o, site, engine, argv, templates));
  }
};
