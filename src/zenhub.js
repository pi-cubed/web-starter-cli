const { integration } = require('./integration');

const name = 'ZenHub';

const login = creds => {
  // TODO
};

const create = (creds, app) => {
  // TODO
};

const remove = (creds, app) => {
  // TODO
};

exports = module.exports = integration({ name, login, create, remove });
