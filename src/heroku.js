const Heroku = require('heroku-client');
const { integration } = require('./integration');

const NAME = 'Heroku';
const TOKEN = 'HEROKU_API_TOKEN';

const create = (name, creds) => {
  // TODO add credentials as argument
  const client = new Heroku({ token: process.env[creds[NAME][TOKEN]] });
  return client.post('/apps', { body: { name } }).catch(e => {
    throw `Heroku error: ${e.body.message}`;
  });
};

const remove = (name, creds) => {
  // TODO
  console.log(name, creds);
};

const heroku = integration(NAME, create, remove, [
  {
    token: {
      env: 'HEROKU_API_TOKEN',
      name: 'API token'
    }
  },
  {
    username: {
      env: 'HEROKU_USERNAME'
    },
    password: {
      env: 'HEROKU_PASSWORD'
    }
  }
]);

exports = module.exports = heroku;
