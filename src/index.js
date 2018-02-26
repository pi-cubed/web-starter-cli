const inquirer = require('inquirer');
const download = require('download-git-repo');
const replaceInFile = require('replace-in-file');
const fs = require('fs');

const NAME = 'web-starter';
const DESCRIPTION = 'Starter kit for making web apps using JS';
const AUTHOR = 'Dylan Richardson';

const replace = options => replaceInFile(options)
  .then(changes => console.log('Modified files:', changes.join(', ')))
  .catch(error => console.error('Error occurred:', error));


const prompts = [
  {
    type: 'input',
    name: 'name',
    message: "What's the name of your app?",
    validate: input => (input ? true : 'Must provide a name for your app.')
  },
  {
    type: 'input',
    name: 'description',
    message: "What's the description of your app?",
  },
  {
    type: 'input',
    name: 'author',
    message: "What's your name?"
  }
];

exports = module.exports = () => {
  inquirer
    .prompt(prompts)
    .then(({ name, description, author }) => {
      download('drich14/web-starter', name, err => {
        if (err) {
          throw err;
        }

        replace({
          files: [
            `${name}/**/*`,
            `${name}/.env*`
          ],
          from: [NAME],
          to: [name]
        }).then(() => {
          // replaceInFile does not work in parallel
          if (description) {
            replace({
              files: `${name}/README.md`,
              from: [DESCRIPTION],
              to: [description]
            });
          }
          if (author) {
            replace({
              files: `${name}/LICENSE`,
              from: [AUTHOR],
              to: [author]
            });
          }
        });

        const packageFile = `${name}/package.json`;
        const config = JSON.parse(fs.readFileSync(packageFile));

        config.version = '0.1.0';
        config.description = description || '';
        config.author = author || '';

        fs.writeFileSync(packageFile, JSON.stringify(config, null, '\t'));
      });
    });
};
