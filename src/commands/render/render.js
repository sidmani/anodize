const fs = require('fs-extra');
const path = require('path');
const showdown = require('showdown');
const mathjax = require('mathjax-node-page').mjpage;

const defaultTemplate = fs.readFileSync(require.resolve('./default.liquid'), 'utf8');

const converter = new showdown.Converter({ tasklists: true });

const env = {
  now: Math.round(new Date() / 1000),
};

function renderFile(object, site, engine, argv, currentDir) {
  let template;
  try {
    // load template
    template = fs.readFileSync(path.join(argv.path.template, object.layout), 'utf8');
  } catch (e) {
    console.log('Warning: could not find template ' + object.layout);
    return;
  }
  // override head parameters from document
  const head = {};
  Object.assign(head, argv.head);
  Object.assign(head, object.head);
  // run liquid on object body
  engine.parseAndRender(object.body, {
    site,
    object,
    current: currentDir,
    global: argv.global,
    env,
  })
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
      object.body = body;
      return engine.parseAndRender(template, {
        site,
        object,
        current: currentDir,
        global: argv.global,
        env,
      });
    })
  // Liquid on html and default template with <head>
    .then(res => engine.parseAndRender(defaultTemplate, {
      head,
      doc: res,
    }))
  // output the file
    .then((html) => {
      if (object.type === 'index' || argv.indexify) {
        fs.outputFileSync(path.join(argv.path.target, object.path, 'index.html'), html);
      } else {
        fs.outputFileSync(path.join(argv.path.target, path.dirname(object.path), `${path.basename(object.path)}.html`), html);
      }
    })
    .catch(console.log);
}

module.exports = function render(base, site, engine, argv) {
  base.forEach((object, idx) => {
    if (Array.isArray(object)) {
      // object is directory
      render(object, site, engine, argv);
    } else if (object.type === 'markdown') {
      // object is markdown
      object.idx = idx;
      renderFile(object, site, engine, argv, base);
    } else if (!argv['no-static']) {
      // object is static file
      fs.copySync(
        path.join(argv.path.source, object.path),
        path.join(argv.path.target, object.path),
      );
    }
  });

  if (base.index) {
    renderFile(base.index, site, engine, argv, base);
  }
};
