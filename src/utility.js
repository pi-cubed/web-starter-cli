const deepMerge = require('deepmerge');
const download = require('download-git-repo');
const replaceInFile = require('replace-in-file');
const fs = require('fs');
const execa = require('execa');

const merge = o1 => o2 => {
  return deepMerge(o1, o2);
};

const mergeList = l => l.reduce(deepMerge, {});

const NAME = 'web-starter';
const DESCRIPTION = 'Starter kit for making web apps using JS';
const AUTHOR = 'Dylan Richardson';
const REPO = 'drich14/web-starter';

const envify = name => name.toUpperCase().replace(' ', '_');

const replaceGeneral = (_, opts) =>
  replaceInFile(
    merge({
      ignore: 'node_modules/*' // TODO fix
    })(opts)
  ).catch(() => {});

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

const exec = (a, b) => {
  const p = execa(a, b);
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
  return p;
};

const downloadStarterRepo = name =>
  new Promise((res, rej) => download(REPO, name, e => (e ? rej(e) : res())));

exports = module.exports = {
  merge,
  mergeList,
  envify,
  replacePackage,
  replaceGeneral,
  replaceEnv,
  replaceOpts,
  exec,
  downloadStarterRepo
};
