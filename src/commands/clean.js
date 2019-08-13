const fs = require('fs-extra');

exports.command = 'clean';
exports.describe = 'delete all generated files';

exports.handler = function handler(argv) {
  fs.unlinkSync(argv.path.cache);
  fs.emptydirSync(argv.path.target);
};
