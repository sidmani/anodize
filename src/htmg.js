'use strict';
/* HTMG - HyperText Markup Generator */

exports.doctype = '<!DOCTYPE html>\n';

exports.createTag = function createTag(name, close = false, attr = {}, newline = true) {
  let tag = `<${close ? '/' : ''}${name}`;
  Object.keys(attr).forEach((key) => {
    tag += ` ${key}="${attr[key]}"`;
  });
  tag += '>';
  tag += newline ? '\n' : '';
  return tag;
};

// exports.createElement = function(name, innerElements = '', attr = {}) {
//
// }

exports.buildDocument = function buildDocument(docString, head) {
  let document = '';
  // doctype declaration
  document += exports.doctype;
  // begin html
  document += exports.createTag('html');
  // begin head
  document += exports.createTag('head');

  // charset
  document += exports.createTag('meta', false, { charset: head.charset });

  // title
  document += exports.createTag('title', false, {}, false);
  document += head.title;
  document += exports.createTag('title', true);

  // description
  document += exports.createTag('meta', false, { name: 'description', content: head.description });

  // keywords
  if (Array.isArray(head.keywords)) {
    document += exports.createTag('meta', false, { name: 'keywords', content: head.keywords.join(',') });
  }

  // css
  let css;
  if (Array.isArray(head.css)) {
    ({ css } = head);
  } else if (typeof head.css === 'string') {
    css = [head.css];
  }

  document += css
    .map(c => exports.createTag('link', false, { rel: 'stylesheet', href: c }))
    .join('');

  // raw tags
  document += head.raw.join('\n');

  document += exports.createTag('head', true);
  // body
  document += exports.createTag('body');
  document += docString;
  document += exports.createTag('body', true);
  document += exports.createTag('html', true);
  return document;
};
