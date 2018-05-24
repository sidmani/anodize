'use strict'

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
  'recreate-target': {
    describe: 'Recreate the empty target directory after deletion',
    boolean: true,
    default: true,
  }
};

function erase(target, recreate) {
  fs.removeSync(target);
  if (recreate) {
    fs.mkdirpSync(target);
  }
}

exports.handler = function(argv) {
  if (!argv.force) {
    inquirer.prompt([{
      message: 'WARNING: possibly destructive action. Are you sure you want to erase the contents of ' + argv.path.target + '?',
      type: 'confirm',
      name: 'delete',
    }])
      .then(answers => {
        if (answers.delete) {
          erase(argv.path.target, argv['recreate-target'])
          console.log('Contents erased.');
        } else {
          console.log('Aborted.');
        }
      });
  } else {
    erase(argv.path.target, argv['recreate-target'])
  }
};
