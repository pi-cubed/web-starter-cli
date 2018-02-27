require('dotenv').config();
const yargs = require('yargs');
const inquirer = require('inquirer');
const download = require('download-git-repo');
const replaceInFile = require('replace-in-file');
const fs = require('fs');
const heroku = require('./heroku');

const { argv: { disableIntegrations } } = yargs
  .alias('x', 'disableIntegrations')
  .boolean('x')
  .describe('x', 'Do not setup integrations')
  .help();

const NAME = 'web-starter';
const DESCRIPTION = 'Starter kit for making web apps using JS';
const AUTHOR = 'Dylan Richardson';

const replace = (files, from, to) =>
  replaceInFile({ files, from: [from], to: [to] })
    .then(changes => console.log('Modified files:', changes.join(', ')))
    .catch(error => console.error('Error occurred:', error));

const prompts = [
  {
    type: 'input',
    name: 'name',
    message: "What's the name of your app?",
    validate: name => {
      if (!name) return 'Please provide a name for your app.';
      if (!disableIntegrations) return heroku(name).then(() => true);
      return true;
    }
  },
  {
    type: 'input',
    name: 'description',
    message: "What's the description of your app?"
  },
  {
    type: 'input',
    name: 'author',
    message: "What's your name?"
  }
];

const customize = ({ name, description, author }) => {
  replace([`${name}/**/*`, `${name}/.env*`], NAME, name).then(() => {
    // replaceInFile does not work in parallel
    if (description) {
      replace(`${name}/README.md`, DESCRIPTION, description);
    }
    if (author) {
      replace(`${name}/LICENSE`, AUTHOR, author);
    }

    const packageFile = `${name}/package.json`;
    const config = JSON.parse(fs.readFileSync(packageFile));

    config.version = '0.1.0';
    config.description = description || '';
    config.author = author || '';

    fs.writeFileSync(packageFile, JSON.stringify(config, null, '\t'));
  });
};

exports = module.exports = () => {
  inquirer.prompt(prompts).then(data => {
    // download web-starter repo
    download('drich14/web-starter', data.name, err => {
      if (err) {
        // TODO undo integrations
        throw err;
      }
      customize(data);
    });
  });
};
