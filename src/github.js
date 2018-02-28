const { integration } = require('./integration');

const NAME = 'GitHub';

const create = (name, creds) => {
  // TODO add credentials as argument
  console.log(name, creds);
};

const remove = (name, creds) => {
  // TODO
  console.log(name, creds);
};

exports = module.exports = integration(NAME, create, remove);
