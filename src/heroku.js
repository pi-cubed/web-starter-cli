const { integration } = require('./integration');
// const Heroku = require('heroku-client');

const name = 'Heroku';

const login = (app, creds) => {
  // TODO
  console.log(app, creds);
};

const create = (app, creds) => {
  // TODO
  console.log(app, creds);
  // const client = new Heroku({ token: process.env[creds[NAME][TOKEN]] });
  // return client.post('/apps', { body: { name } }).catch(e => {
  //   throw `Heroku error: ${e.body.message}`;
  // });
};

const remove = (app, creds) => {
  // TODO
  console.log(app, creds);
};

exports = module.exports = integration({ name, login, create, remove });
