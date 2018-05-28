'use strict';

const fs = require('fs-extra');
const inquirer = require('inquirer');

exports.command = 'clean';
exports.describe = 'delete all generated files';
exports.builder = {
  force: {
    alias: ['f'],
    describe: 'Do not ask for confirmation before deletion',
    boolean: true,
    default: false,
  },
  'no-recreate-target': {
    describe: 'Recreate the empty target directory after deletion',
    boolean: true,
    default: false,
  },
};

function erase(target, recreate) {
  fs.removeSync(target);
  if (recreate) {
    fs.mkdirpSync(target);
  }
}

exports.handler = function handler(argv) {
  if (!argv.force) {
    inquirer
      .prompt([{
        message: `WARNING: possibly destructive action. Are you sure you want to erase the contents of ${argv.path.target} ?`,
        type: 'confirm',
        name: 'delete',
      }])
      .then((answers) => {
        if (answers.delete) {
          erase(argv.path.target, !argv['no-recreate-target']);
        } else {
          console.log('Aborted.');
        }
      });
  } else {
    erase(argv.path.target, !argv['no-recreate-target']);
  }
};
