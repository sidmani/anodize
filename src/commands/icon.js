'use strict';
const favicon = require('favicons');
const path = require('path');
const fs = require('fs-extra');

exports.command = 'icon';
exports.describe = 'Generate web icons from a single source image';
exports.builder = {
  icon: {
    describe: 'icon source image',
    default: 'icon.png',
  },
};


exports.handler = function handler(argv) {
  favicon(path.join(argv.source, argv.icon), {}, (err, res) => {
    res.images.forEach((i) => {
      fs.writeFile(path.join(argv.target, i.name), i.contents);
    });
  });
};
