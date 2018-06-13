'use strict';

const fs = require('fs-extra');
const path = require('path');
const showdown = require('showdown');

const defaultTemplate = fs.readFileSync(require.resolve('./default.liquid'), 'utf8');

const converter = new showdown.Converter();

function renderFile(object, site, engine, argv, currentDir) {
  try {
    const template = fs.readFileSync(path.join(argv.path.template, object.layout), 'utf8');
    engine.parseAndRender(object.body, {
      site,
      object,
      current: currentDir,
      global: argv.global,
    })
      .then((body) => {
        object.body = converter.makeHtml(body);
        return engine.parseAndRender(template, {
          site,
          object,
          current: currentDir,
          global: argv.global,
        });
      })
      .then(res => engine.parseAndRender(defaultTemplate, {
        head: argv.head,
        doc: res,
      }))
      .then((html) => {
        if (object.id === 'index' || argv.indexify) {
          fs.outputFileSync(path.join(argv.path.target, object.path, 'index.html'), html);
        } else {
          fs.outputFileSync(path.join(argv.path.target, `${object.path}.html`), html);
        }
      })
      .catch(console.log);
  } catch (e) {
    console.log('Warning: could not find template ' + object.layout);
  }
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
