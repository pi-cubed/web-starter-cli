const inquirer = require('inquirer');
const download = require('download-git-repo');
const replace = require('replace-in-file');

const NAME = 'web-starter';
const DESCRIPTION = 'Starter kit for making web apps using JS';

exports = module.exports = () => {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: "What's the name of your app?"
      },
      {
        type: 'input',
        name: 'description',
        message: "What's the description of your app?"
      }
    ])
    .then(({ name, description }) => {
      download('drich14/web-starter', name, err => {
        console.log(err ? 'Error' : 'Success');

        const options = {
          files: [
            `${name}/**/*`,
            `${name}/.env*`
          ],
          from: [NAME, DESCRIPTION],
          to: [name, description]
        };

        replace(options)
          .then(changes => {
            console.log('Modified files:', changes.join(', '));
          })
          .catch(error => {
            console.error('Error occurred:', error);
          });
      });
    });
};
