#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;
const showdown = require('showdown');

function isMarkdown(fileName) {
  return fileName.substr(fileName.length - 3) === '.md';
}

function isTemplate(fileName) {
  return fileName.substr(fileName.length - 2) === '.t';
}

function checkTemplatesExist(dir) {
  return fs.existsSync(path.join(dir, 'template.t'));
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
  const body = /^[\W\w]*?\n([\W\w]*)/g.exec(md)[1];
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
  return parseInt(match[3], 10);
}

function replaceSubstr(str, repl, start, end) {
  return str.substr(0, start) + repl + str.substr(end);
}

function paste(obj, template) {
  let result = template;
  let match;
  const staticReplace = /{{ ([^\[\]]+?) }}/g;
  const dynamicReplace = /<< ([^\[\]|]+?)\[([^\[\]]+?),([^\[\]]+?)\] \| ([\W\w]+?) >>/g;
  while ((match = staticReplace.exec(result)) !== null) {
    const key = match[1];
    if (!obj[key]) { continue; }
    if (typeof obj[key] === 'string') {
      result = replaceSubstr(result, obj[key], match['index'], match['index'] + match[0].length);
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
        list += paste(arr[i], repeatedTemplate);
      }
      result = replaceSubstr(result, list, match['index'], match['index'] + match[0].length);
    }
  }
  return result;
}

function run(inputDir, outputDir, extension) {
  // list directories
  const objects = fs.readdirSync(inputDir).map(name => path.join(inputDir, name));

  const indices = {};
  const converter = new showdown.Converter();
  objects
    .filter(filePath => fs.lstatSync(filePath).isDirectory() && checkTemplatesExist(filePath))
    .forEach(directory => {

      const files = [];
      const template = loadTemplate(inputDir, path.join(directory, 'template.t'));
      let list = '';
      const currentDirectoryFiles = fs.readdirSync(directory)
        .filter(filePath => fs.lstatSync(path.join(directory, filePath)).isFile());

      // process all markdown files in templated directories
      currentDirectoryFiles
        .filter(filePath => isMarkdown(filePath))
        .forEach(fileName => {
          const file = fs.readFileSync(path.join(directory, fileName), 'utf8');
          const obj = parse(file);
          files.push(obj);
          obj.body = converter.makeHtml(obj.body);
          const html = paste(obj, template);
          fs.writeFileSync(path.join(outputDir, directory, fileName.substr(0, fileName.length - 3) + extension), html);
        });

      // objects.push(currentDirectoryFiles
      //   .filter(filePath => isTemplate(filePath))
      //   .map(filePath => path.join(directory, filePath)));

      indices[path.basename(directory)] = files;
    });

    objects
      .filter(filePath => fs.lstatSync(filePath).isFile() && isTemplate(filePath))
      .filter(name => name.substr(name.length - 10) !== 'template.t')
      .forEach(templateName => {
        let template = loadTemplate(inputDir, templateName);
        if (template.substring(0, 10) !== '!transform') { return; }
        template = template.substring(10);
        const html = paste(indices, template);
        fs.writeFileSync(path.join(outputDir, templateName.substr(0, templateName.length - 2) + extension), html);
      });
}

const input = argv.i || '.';
const output = argv.o || '.';
const ext = argv.e || '.gen.html';
if (argv._[0] === 'run') {
  run(input, output, ext);
}
