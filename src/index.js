require('dotenv').config();
const inquirer = require('inquirer');
const Promise = require('bluebird');
const download = require('download-git-repo');
const replaceInFile = require('replace-in-file');
const fs = require('fs');
const heroku = require('./heroku');
const { merge } = require('./integration');

const INTEGRATIONS = [heroku];
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
      // TODO create integration apps
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
    // description
    if (description) {
      replace(`${name}/README.md`, DESCRIPTION, description);
    }
    // author
    if (author) {
      replace(`${name}/LICENSE`, AUTHOR, author);
    }
    // package.json
    const packageFile = `${name}/package.json`;
    const config = JSON.parse(fs.readFileSync(packageFile));
    config.version = '0.1.0';
    config.description = description || '';
    config.author = author || '';
    fs.writeFileSync(packageFile, JSON.stringify(config, null, '\t'));
    // .env
    fs
      .createReadStream(`${name}/.env.dev`)
      .pipe(fs.createWriteStream(`${name}/.env`));
  });
};

const integrationNames = INTEGRATIONS.map(i => i.name);

const loginIntegration = integration => {
  const int = INTEGRATIONS.find(i => i.name === integration);
  if (int) return int.login();
  throw 'Integration not implemented yet.';
};

const removeIntegration = integration => {
  const int = INTEGRATIONS.find(i => i.name === integration);
  if (int) return int.remove();
  throw 'Integration not implemented yet.';
};

const main = () =>
  inquirer
    .prompt([
      {
        type: 'checkbox',
        name: 'integrations',
        message: 'Select integrations to setup',
        choices: integrationNames,
        default: integrationNames
      }
    ])
    .then(({ integrations }) =>
      Promise.reduce(
        integrations,
        (all, v) => loginIntegration(v).then(merge(all)),
        {}
      )
        .then(all => inquirer.prompt(prompts).then(merge(all)))
        .then(
          data =>
            new Promise((res, rej) =>
              download(
                'drich14/web-starter',
                data.name,
                err => (err ? rej(err) : res(data))
              )
            )
        )
        .then(data => customize(data))
        .catch(e => {
          // undo integrations
          integrations.forEach(removeIntegration);
          throw e;
        })
    );

exports = module.exports = () =>
  main().catch(e => {
    console.log(e);
    process.exit(1);
  });
