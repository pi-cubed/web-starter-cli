require('dotenv').config();
const inquirer = require('inquirer');
const Promise = require('bluebird');
const download = require('download-git-repo');
const replaceInFile = require('replace-in-file');
const fs = require('fs');
const { merge, mergeList } = require('./integration');
const heroku = require('./heroku');
const github = require('./github');
const zenhub = require('./zenhub');
const { Repository } = require('nodegit');

const INTEGRATIONS = mergeList([heroku, github, zenhub]);
const INT_NAMES = Object.keys(INTEGRATIONS);
const INT_OPTIONS = [
  {
    type: 'checkbox',
    name: 'names',
    message: 'Select integrations to setup',
    choices: INT_NAMES,
    default: INT_NAMES
  }
];

const NAME = 'web-starter';
const DESCRIPTION = 'Starter kit for making web apps using JS';
const AUTHOR = 'Dylan Richardson';
const REPO = 'drich14/web-starter';
const CUSTOM_OPTIONS = [
  {
    type: 'input',
    name: 'name',
    message: "What's the name of your app?",
    validate: name => (!name ? 'Please provide a name for your app.' : true)
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

const replaceGeneral = (_, opts) => replaceInFile(opts);

const replacePackage = ({ name, description, author }) => () => {
  const packageFile = `${name}/package.json`;
  const config = JSON.parse(fs.readFileSync(packageFile));
  config.version = '0.1.0';
  config.description = description || '';
  config.author = author || '';
  fs.writeFileSync(packageFile, JSON.stringify(config, null, '\t'));
};

const replaceEnv = ({ name }) => () =>
  fs
    .createReadStream(`${name}/.env.dev`)
    .pipe(fs.createWriteStream(`${name}/.env`));

const replaceOpts = ({ name, description, author }) => [
  { files: [`${name}/**/*`, `${name}/.env*`], from: [NAME], to: [name] },
  {
    files: description ? `${name}/README.md` : '',
    from: [DESCRIPTION],
    to: [description]
  },
  { files: author ? `${name}/LICENSE` : '', from: [AUTHOR], to: [author] }
];

const customizeStarter = data =>
  Promise.reduce(replaceOpts(data), replaceGeneral, [])
    .then(replacePackage(data))
    .then(replaceEnv(data));

const toIntegrations = ({ names }) =>
  names.map(name => ({ [name]: INTEGRATIONS[name] }));

const promptIntegrations = () =>
  inquirer
    .prompt(INT_OPTIONS)
    .then(toIntegrations)
    .then(mergeList);

const promptAuthentication = integrations =>
  Promise.mapSeries(Object.values(integrations), i => i.auth())
    .then(mergeList)
    .then(merge(integrations));

const loginIntegrations = integrations =>
  Promise.map(Object.values(integrations), i => i.login(i)).then(
    () => integrations
  );

// const validateName = integrations => name =>
//   name
//     ? Promise.map(Object.values(integrations), i => i.create(i, name)).then(
//         () => true
//       )
//     : 'Please provide a name for your app.';

const promptCustomizions = integrations =>
  inquirer.prompt(CUSTOM_OPTIONS).then(merge(integrations));

const downloadStarter = data =>
  new Promise((res, rej) =>
    download(REPO, data.name, e => (e ? rej(e) : res(data)))
  );

const initGit = integrations =>
  Repository.init(integrations.name, 0)
    // TODO .then(repo => repo.createCommitOnHead(['.'],
    //            integrations.author, 'hew', 'Initial commit'))
    .then(() => integrations);

const createIntegrations = integrations => {};

const removeIntegrations = e => {
  Object.values(INTEGRATIONS).forEach(i => i.remove());
  throw e;
};

const handleError = e => {
  console.log(e);
  process.exit(1);
};

const main = () =>
  promptIntegrations()
    .then(promptAuthentication)
    .then(loginIntegrations)
    .then(promptCustomizions)
    .then(downloadStarter)
    .then(initGit)
    .then(customizeStarter)
    .then(createIntegrations)
    .catch(removeIntegrations)
    .catch(handleError);

exports = module.exports = () => main();
