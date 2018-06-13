'use strict';

const converter = new require('showdown').Converter();
const liquid = require('liquidjs');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

const engine = (() => {
  const engine = new Liquid();
  engine.registerFilter('markdown', md => converter.makeHtml(md));
  // engine.registerFilter('dateFormat', timestamp => )
  return engine;
})();

module.exports.render = function renderMarkdown(object, site, argv, currentDir) {
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
};
