module.exports = [{
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

