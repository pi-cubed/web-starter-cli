const { integration } = require('./integration');

const NAME = 'ZenHub';

const create = (name, creds) => {
  // TODO add credentials as argument
  console.log(name, creds);
  // const client = new Heroku({ token: process.env[creds[NAME][TOKEN]] });
  // return client.post('/apps', { body: { name } }).catch(e => {
  //   throw `Heroku error: ${e.body.message}`;
  // });
};

const remove = (name, creds) => {
  // TODO
  console.log(name, creds);
};

exports = module.exports = integration(NAME, create, remove);
