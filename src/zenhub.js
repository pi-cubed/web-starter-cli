const { integration } = require('./integration');

const name = 'ZenHub';

const login = (app, creds) => {
  // TODO
  console.log(app, creds);
};

const create = (app, creds) => {
  // TODO
  console.log(app, creds);
};

const remove = (app, creds) => {
  // TODO
  console.log(app, creds);
};

exports = module.exports = integration({ name, login, create, remove });
