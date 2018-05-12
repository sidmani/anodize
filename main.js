#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;
const showdown = require('showdown');
const converter = new showdown.Converter();

const marker = '<!-- Generated by Anodize. https://github.com/sidmani/anodize -->';

function hasExt(p, ext) {
  return p.substr(p.length - ext.length) === ext;
}

function getAllMatches(regex, str) {
  const result = [];
  let arr;
  while ((arr = regex.exec(str)) !== null) {
    result.push(arr);
  }
  return result;
}

function parse(md) { // return string html
  const firstLine = /[^\n]*/g.exec(md);
  const title = /^([^\n]*?)(?: <|$)/g.exec(firstLine)[1];
  const body = converter.makeHtml(/^[\W\w]*?\n([\W\w]*)/g.exec(md)[1]);
  const keys = { title, body };
  getAllMatches(/<([\w]+?):([\w\W]+?)>/g, firstLine).forEach(match => keys[match[1]] = match[2]);
  return keys;
}

function loadTemplate(inputDir, templatePath) {
  let template = fs.readFileSync(path.join(inputDir, templatePath), 'utf8');
  return template.replace(/\[\[ ([\W\w]+?) \]\]/g, (match, path) => loadTemplate(inputDir, path));
}

function parseBound(bound, length) {
  const match = /^(\$)$|^(\$-)?([\d]+)$/g.exec(bound);
  if (match[1]) { return length; }
  if (match[2]) { return Math.max(0, length - parseInt(match[3], 10)); }
  return Math.min(parseInt(match[3], 10), length);
}

function replaceSubstr(str, repl, start, end) {
  return str.substr(0, start) + repl + str.substr(end);
}

function paste(obj, template) {
  let result = template;
  let match;
  const staticReplace = /{{ ([^\{\}]+?) }}/g;
  const dynamicReplace = /<< ([^\[\]|]+?)\[([^\[\]]+?),([^\[\]]+?)\] \| ([\W\w]+?) >>/g;
  const conditionalReplace = /\?\? ([^?|]+?) \| ([^?]+?) \?\?/g;
  const markdownReplace = /<\( ([\W\w]*?) \)>/g;
  while ((match = staticReplace.exec(result)) !== null) {
    const key = match[1];
    if (!obj[key]) { continue; }
    if (typeof obj[key] === 'string') {
      result = replaceSubstr(result, obj[key], match['index'], match['index'] + match[0].length);
      staticReplace.lastIndex -= match[0].length;
    }
  }

  while ((match = dynamicReplace.exec(result)) !== null) {
    const arr = obj[match[1]];
    if (Array.isArray(arr) && match[2]) {
      const lower = parseBound(match[2], arr.length);
      const upper = parseBound(match[3], arr.length);
      const repeatedTemplate = match[4];
      let list = '';
      for (let i = lower; i < upper && i < arr.length; i++) {
        list = paste(arr[i], repeatedTemplate) + list;
      }
      result = replaceSubstr(result, list, match['index'], match['index'] + match[0].length);
      dynamicReplace.lastIndex -= match[0].length;
    }
  }

  while ((match = markdownReplace.exec(result)) !== null) {
    result = replaceSubstr(result, converter.makeHtml(match[1]), match['index'], match['index'] + match[0].length);
    markdownReplace.lastIndex -= match[0].length;
  }

  while ((match = conditionalReplace.exec(result)) !== null) {
    let replace = '';
    let invert = false
    if (match[1].substr(0,1) === '!') {
      match[1] = match[1].substr(1);
      invert = true;
    }
    if ((obj[match[1]] ? true : false) === !invert) {
      const conditionalTemplate = match[2];
      replace = paste(obj, conditionalTemplate);
    }
    result = replaceSubstr(result, replace, match['index'], match['index'] + match[0].length,);
    conditionalReplace.lastIndex -= match[0].length;
  }
  return result;
}

function enumerateFiles(directory, files = []) {
  fs.readdirSync(directory)
    .filter(obj => obj.substr(0, 1) !== '.') // ignore dotfiles
    .forEach(obj => {
      const filePath = path.join(directory, obj);
      const lstat = fs.lstatSync(filePath);
      if (lstat.isDirectory()) {
        files = enumerateFiles(filePath, files);
        // files.concat();
      } else if (lstat.isFile()) {
        files.push(filePath);
      }
    });
  return files;
}

function clean(inputDir, ext, check, logger) {
  enumerateFiles(inputDir)
    .filter(f => hasExt(f, ext))
    .forEach(f => {
      const file = fs.readFileSync(f, 'utf8');
      const firstLine = /[^\n]*/g.exec(file)[0];

      if (firstLine === marker) {
        if (check) {
          console.log(f);
        } else {
          fs.unlinkSync(f);
        }
      }
    });
}

function run(inputDir, outputDir, extension, check, logger) {
  // list directories
  const objects = enumerateFiles(inputDir);

  // get relevant files
  const markdownFiles = objects.filter(obj => hasExt(obj, '.md'));
  const transformTemplates = objects.filter(obj => hasExt(obj, '.tt'));

  const indices = {};
  markdownFiles.forEach(p => {
    const file = fs.readFileSync(p, 'utf8');
    const obj = parse(file);
    obj.id = path.basename(p).slice(0, -3);
    const dir = path.basename(path.dirname(p));
    if (indices[dir]) {
      indices[dir].push(obj);
    } else {
      indices[dir] = [obj];
    }
    indices[dir].path = p;
  });

  Object.keys(indices).forEach(key => {
    indices[key] = indices[key].sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const p = indices[key].path;
    try {
      const template = loadTemplate(inputDir, path.join(path.dirname(p), 'template.t'));
      indices[key].forEach((obj, idx, arr) => {
        if (arr[idx-1]) {
          obj.prev = arr[idx-1].id;
        }
        if (arr[idx+1]) {
          obj.next = arr[idx+1].id;
        }
        const html = marker + '\n' + paste(obj, template);
        if (!check) {
          fs.writeFileSync(path.join(outputDir, path.relative(inputDir, path.dirname(p)), obj.id + extension), html);
        }
      });
    } catch (e) {
      console.log('Warning: no template.t in ' + path.dirname(p));
    }
  });

  transformTemplates.forEach(p => {
    let template = loadTemplate(inputDir, p);
    const html =  marker + '\n' + paste(indices, template);
    if (!check) {
      fs.writeFileSync(path.join(outputDir, p.slice(0, -3) + extension), html);
    }
  });

  if (check) { console.log('Anodize: syntax OK.'); }
}

const input = argv.i || '.';
const ext = argv.e || '.html';
const output = argv.o || '.';
if (argv._[0] === 'run') {
  run(input, output, ext, argv.c);
} else if (argv._[0] === 'clean') {
  clean(input, argv.e || '', argv.c);
} else if (argv._[0] === 'watch') {
  console.log('Watching directory ' + input);
  fs.watch(input, { recursive: true }, (eventType, filename) => {
    if (!hasExt(filename, ext)) {
      console.log('Change in ' + filename + ', regenerating...');
      run(input, output, ext, argv.c);
    }
  });
}
