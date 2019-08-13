const showdown = require('showdown');
const liquidjs = require('liquidjs');
const moment = require('moment');

const extensions = [{
  type: 'lang',
  regex: /([\w])--([\w])/g,
  replace: '$1&mdash;$2',
}, {
  type: 'lang',
  filter: (text) => {
    const fnRef = /(?<!!)\^\[([\W\w]+?)\]/g;
    const notes = {};
    let note;
    let idx = 1;
    while ((note = fnRef.exec(text)) !== null) {
      note = note[1];
      if (notes[note]) {
        console.log(`WARNING: duplicate footnote ${note}, ignoring...`);
        continue;
      }
      notes[note] = idx;
      const replaceRef = `(?<!!)\\^\\[${note}\\]`;
      const replaceNote = `!\\^\\[${note}\\]`;
      text = text.replace(new RegExp(replaceRef, 'g'), `<sup><a href="#fn${idx}">${idx}</a></sup>`);
      text = text.replace(new RegExp(replaceNote, 'g'), `<span id="fn${idx}"></span>${idx}. `);
      idx += 1;
    }
    return text;
  },
}];

module.exports.markdown = function markdown() {
  return new showdown.Converter({ extensions });
};

module.exports.liquid = function liquid(templateDir) {
  const engine = new liquidjs({
    root: templateDir,
    cache: true,
    extname: '.liquid',
  });
  engine.registerFilter('dateFormat', (timestamp, format) => moment.unix(timestamp).format(format));
  engine.registerFilter('sortItems', (obj) => {
    const items = {};
    Object.assign(items, obj);
    delete items['index.md'];
    const sortKey = obj['index.md'] && obj['index.md'].keys.sortBy ? obj['index.md'].keys.sortBy : 'sort';
    return Object.values(items).sort((a, b) => {
      if (b.keys && a.keys) {
        return (b.keys[sortKey] || 0) - (a.keys[sortKey] || 0);
      }
      if (b.id.toUpperCase() > a.id.toUpperCase()) {
        return -1;
      }
      return 1;
    });
  });
  return engine;
};
