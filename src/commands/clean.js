const fs = require('fs-extra');

exports.command = 'clean';
exports.describe = 'delete all generated files';

exports.handler = function handler(argv) {
  fs.emptydirSync(argv.path.target);
};
