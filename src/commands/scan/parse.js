'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');
const moment = require('moment');

const dateFormats = ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm'];

/* Creates an object representing a markdown file
 * * * Guaranteed to have the following keys:
 * body: the body of the file
 * type: either 'markdown' or 'index'
 * layout: the liquid file to use for templating
 * * * Optionally has the following keys:
 * date: a string formatted YYYY-MM-DD
 */
module.exports = function parse(filePath) {
  const file = fs.readFileSync(filePath, 'utf-8');
  // split the header and body by the first --- in the file
  const parsed = /^([\W\w]+?)\n---\n([\W\w]*)/g.exec(file);
  const object = {};
  if (parsed && parsed[1]) {
    // parse the keys from the YAML header
    Object.assign(object, yaml.safeLoad(parsed[1]));
    // set the body of the file
    [,, object.body] = parsed;
  } else {
    object.body = file;
  }

  if (path.basename(filePath) === 'index.md') {
    object.type = 'index';
    object.layout = object.layout || 'index.liquid';
  } else {
    object.type = 'markdown';
    object.layout = object.layout || path.basename(path.dirname(filePath)) + '.liquid';
  }

  object.date = moment(object.date, dateFormats).unix() || object.date;

  object.sort = object.sort || 0;

  return object;
};
