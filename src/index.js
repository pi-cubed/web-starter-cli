require('dotenv').config();
const inquirer = require('inquirer');
const Promise = require('bluebird');
const {
  merge,
  mergeList,
  downloadStarterRepo,
  replaceOpts,
  replaceGeneral,
  replacePackage,
  replaceEnv,
  exec
} = require('./utility');
const { Repository } = require('nodegit');

const heroku = require('./integrations/heroku');
const github = require('./integrations/github');
const zenhub = require('./integrations/zenhub');

const INTEGRATIONS = mergeList([github, heroku, zenhub]);

const INTEGRATION_NAMES = Object.keys(INTEGRATIONS);

const INTEGRATION_OPTIONS = [
  {
    type: 'checkbox',
    name: 'names',
    message: 'Select integrations to setup',
    choices: INTEGRATION_NAMES,
    default: INTEGRATION_NAMES
  }
];

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

const toIntegrations = ({ names }) =>
  names.map(name => ({ [name]: INTEGRATIONS[name] }));

const mapIntegrations = (opts, key, f) =>
  Promise.map(Object.entries(opts.integrations), x => ({
    [x[0]]: { [key]: f(x[1]) }
  }))
    .then(mergeList)
    .then(x => merge(opts)({ integrations: x }));

const promptIntegrations = () =>
  inquirer
    .prompt(INTEGRATION_OPTIONS)
    .then(toIntegrations)
    .then(mergeList)
    .then(integrations => merge({})({ integrations }));

const promptAuthentication = opts =>
  Promise.mapSeries(Object.values(opts.integrations), i => i.auth())
    .then(mergeList)
    .then(merge(opts.integrations))
    .then(integrations => merge(opts)({ integrations }));

const loginIntegrations = opts => {
  console.log('\nAuthenticating integrations...\n');
  return mapIntegrations(opts, 'client', i => i.login(opts));
};

const promptCustomizions = opts =>
  inquirer.prompt(CUSTOM_OPTIONS).then(merge(opts));

const downloadStarter = opts => {
  console.log('\nDownloading web-starter repo...\n');
  return downloadStarterRepo(opts.name).then(() => opts);
};

const cdStarter = opts => {
  process.chdir(`./${opts.name}`);
  return opts;
};

const initGit = opts => Repository.init(opts.name, 0).then(() => opts);

const customizeStarter = opts => {
  console.log('\nCustomizing web-starter repo...\n');
  return Promise.reduce(replaceOpts(opts), replaceGeneral, [])
    .then(replacePackage(opts))
    .then(replaceEnv(opts))
    .then(() => opts);
};

const installDeps = opts => {
  console.log('\nInstalling dependencies...\n');
  return exec('yarn').then(() => opts);
};

const createIntegrations = opts => {
  console.log('\nCreating integrations...\n');
  return mapIntegrations(opts, 'app', i => i.create(opts));
};

const startApp = opts => {
  console.log(`\nStarting ${opts.name}...\n`);
  return exec('yarn', ['dev']).then(() => opts);
};

const removeIntegrations = opts => {
  throw opts;
  // Error('Not implemented: remove your integrations', opts);
  // console.log('\nRemoving integrations...\n');
  // return Object.values(opts.integrations).forEach(i => i.remove(opts));
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
    .then(cdStarter)
    .then(initGit)
    .then(customizeStarter)
    .then(installDeps)
    .then(createIntegrations)
    .then(startApp)
    .catch(removeIntegrations) // TODO pass opts somehow
    .catch(handleError);

exports = module.exports = main;
