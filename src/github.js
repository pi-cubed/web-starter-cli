const { integration } = require('./integration');
const GitHub = require('github-api');

const name = 'GitHub';

const login = opts => new GitHub(opts);

const create = opts => opts.integrations[name].getUser().createRepo(opts);

const remove = opts => {
  // TODO
  return opts.integrations[name].app.deleteRepo();
};

exports = module.exports = integration({ name, login, create, remove });
