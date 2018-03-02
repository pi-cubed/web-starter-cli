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
const execa = require('execa');

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

const replaceGeneral = (_, opts) =>
  replaceInFile(
    merge({
      ignore: 'node_modules/*' // TODO fix
    })(opts)
  );

const replacePackage = ({ name, description, author }) => () => {
  const packageFile = 'package.json';
  const config = JSON.parse(fs.readFileSync(packageFile));
  config.version = '0.1.0';
  config.description = description || '';
  config.author = author || '';
  fs.writeFileSync(packageFile, JSON.stringify(config, null, '\t'));
};

const replaceEnv = ({ name }) => () =>
  fs.createReadStream('.env.dev').pipe(fs.createWriteStream('.env'));

const replaceOpts = ({ name, description, author }) => [
  { files: ['./**/*', '.env*'], from: [NAME], to: [name] },
  {
    files: description ? 'README.md' : '',
    from: [DESCRIPTION],
    to: [description]
  },
  { files: author ? 'LICENSE' : '', from: [AUTHOR], to: [author] }
];

const customizeStarter = opts => {
  console.log('\nCustomizing web-starter repo...\n');
  return Promise.reduce(replaceOpts(opts), replaceGeneral, [])
    .then(replacePackage(opts))
    .then(replaceEnv(opts))
    .then(() => opts);
};

const toIntegrations = ({ names }) =>
  names.map(name => ({ [name]: INTEGRATIONS[name] }));

const promptIntegrations = () =>
  inquirer
    .prompt(INT_OPTIONS)
    .then(toIntegrations)
    .then(mergeList)
    .then(integrations => merge({})({ integrations }));

const promptAuthentication = opts =>
  Promise.mapSeries(Object.values(opts.integrations), i => i.auth())
    .then(mergeList)
    .then(merge(opts.integrations))
    .then(integrations => merge(opts)({ integrations }));

const mapIntegrations = (opts, key, f) =>
  Promise.map(Object.entries(opts.integrations), x => ({
    [x[0]]: merge(x[1])({ [key]: f(x[1]) })
  })).then(x => merge(opts)({ integrations: mergeList(x) }));

const loginIntegrations = opts => {
  console.log('\nAuthenticating integrations...\n');
  return mapIntegrations(opts, 'client', i => i.login(opts));
};

const promptCustomizions = opts =>
  inquirer.prompt(CUSTOM_OPTIONS).then(merge(opts));

const downloadStarter = opts => {
  console.log('\nDownloading web-starter repo...\n');
  return new Promise((res, rej) =>
    download(REPO, opts.name, e => (e ? rej(e) : res(opts)))
  );
};

const initGit = opts =>
  Repository.init(opts.name, 0)
    // TODO .then(repo => repo.createCommitOnHead(['.'],
    //            opts.author, 'hew', 'Initial commit'))
    .then(() => opts);

const exec = (a, b) => {
  const p = execa(a, b);
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
  return p;
};

const installDeps = opts => {
  console.log('\nInstalling dependencies...\n');
  return exec('yarn').then(() => opts);
};

const createIntegrations = opts => {
  console.log('\nIntegrations doing them thang...\n');
  return mapIntegrations(opts, 'app', i => i.create(opts));
};

// start app in background
const startApp = opts => {
  console.log(`\nStarting ${opts.name}...\n`);
  return exec('yarn', ['dev']).then(() => opts);
};

const removeIntegrations = opts => {
  console.log('\nRemoving integrations...\n');
  return Object.values(opts.integrations).forEach(i => i.remove(opts));
};

const handleError = e => {
  console.log(e);
  process.exit(1);
};

const cdStarter = opts => {
  process.chdir(`./${opts.name}`);
  console.log(process.cwd());
  return opts;
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
