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
};

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
          fs.emptydirSync(argv.path.target);
        } else {
          console.log('Aborted.');
        }
      });
  } else {
    fs.emptydirSync(argv.path.target);
  }
};
