const fs = require('fs-extra');

exports.command = 'clean';
exports.describe = 'delete all generated files';

exports.handler = function handler(argv) {
  fs.emptydirSync(argv.path.target);
  try {
    fs.unlinkSync(argv.path.cache);
  } catch (e) {
    // silence failure to delete cache
  }
};
