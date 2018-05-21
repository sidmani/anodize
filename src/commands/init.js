const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

exports.command = 'init';
exports.describe = 'create the anodize directory structure';
exports.builder = {
  input: {
    alias: 'i',
    default: '.',
    describe: 'the directory in which to create the structure',
  },
  root: {
    default: 'root',
    describe: 'the name of the HTTP root directory',
  },
  src: {
    default: 'src',
    describe: 'the name of the source directory'
  },
  gitignore: {
    default: true,
    boolean: true,
    describe: 'add root/ to .gitignore if it exists',
  },
  yaml: {
    default: true,
    describe: 'create .anodize.yml',
  }
};

exports.handler = function (argv) {
  // create the root directory
  const root_path = path.join(argv.input, argv.root);
  if (!fs.existsSync(root_path)) {
    fs.mkdirSync(root_path);
  } else {
    // log
  }

  const src_path = path.join(argv.input, argv.src);
  if (!fs.existsSync(src_path)) {
    fs.mkdirSync(src_path);
  } else {
    // log
  }

  // create .anodize.yml
  const yaml_path = path.join(argv.input, '.anodize.yml');
  if (argv.yaml && !fs.existsSync(yaml_path)) {
    const config = yaml.safeDump({
      root: argv.root,
      src: argv.src,
    });
    fs.writeFileSync(yaml_path, '# .anodize.yml\n# created by anodize on ' + new Date().toUTCString() + '\n' + config);
  } else {
    // log
  }

  // append root/ to .gitignore
  if (argv.gitignore) {
    const gitignore_path = path.join(argv.input, '.gitignore');
    if (fs.existsSync(gitignore_path)) {
      fs.appendFileSync(gitignore_path, '\n' + argv.root);
    } else {
      // no .gitignore, skipping...
    }
  }
};
