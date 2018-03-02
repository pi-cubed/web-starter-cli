const { integration } = require('./integration');

const name = 'GitHub';

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
