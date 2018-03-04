const { integration } = require('../integration');
const GitHub = require('github-api');

const NAME = 'GitHub';

const login = opts => () =>
  new GitHub({ token: opts.integrations[NAME].token });

const create = ({ integrations, name, author, description }) =>
  integrations[NAME].client()
    .getUser()
    .createRepo({ name, author, description });

const remove = async ({ integrations, name }) => {
  const client = integrations[NAME].client();
  const { data } = await client.getUser().getProfile();
  const repo = await client.getRepo(data.login, name);
  return repo.deleteRepo();
};

exports = module.exports = integration({ name: NAME, login, create, remove });
