const inquirer = require('inquirer');
const _ = require('lodash');
const Promise = require('bluebird');
const deepMerge = require('deepmerge');

export const merge = o1 => o2 => {
  return deepMerge(o1, o2);
};

const makePrompt = name => cred =>
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'answer',
        message: `What is your ${name} ${cred}?`
      }
    ])
    .then(({ answer }) => answer);

const makeCredPrompt = (name, creds) => credList => {
  const prompt = makePrompt(name);
  return Promise.reduce(
    Object.keys(credList),
    (all, key) =>
      prompt(credList[key].name || key)
        .then(a => ({ [key]: a }))
        .then(merge(all)),
    {}
  ).then(creds);
};

const promptCredType = (name, creds) => {
  const choices = creds.map(cred => Object.keys(cred).join('/'));
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'choice',
        message: `How do you want to authenticate with ${name}?`,
        choices,
        default: choices[0]
      }
    ])
    .then(({ choice }) => choices.indexOf(choice));
};

// can't refactor to just Object.assign ?
export const mergeList = l => l.reduce(deepMerge, {});

const makeCredentials = (name, credList) => vals => {
  const creds = mergeList(credList);
  return {
    [name]: mergeList(
      Object.keys(creds).map(key => ({
        [key]: process.env[creds[key].env] || vals[key]
      }))
    )
  };
};

const makeAuthPrompt = (name, creds) => async () => {
  const credentials = makeCredentials(name, creds);
  const promptCreds = makeCredPrompt(name, credentials);
  // check env for creds
  // TODO fix should take first complete CredSet
  for (let i = 0; i < creds.length; i += 1) {
    const credList = creds[i];
    const keys = Object.keys(credList);
    const missingKeys = keys.filter(key => !(credList[key].env in process.env));
    if (missingKeys.length < keys.length) {
      // creds are in env
      return missingKeys.length
        ? promptCreds(_.pick(credList, missingKeys))
        : credentials({});
    }
    // check other cred types (continue)
  }
  // no creds in env
  // if more than one type, prompt for type of cred
  const credIndex = creds.length > 1 ? await promptCredType(name, creds) : 0;
  // prompt for creds
  return promptCreds(creds[credIndex]);
};

const envify = name => name.toUpperCase().replace(' ', '_');

const makeToken = name => ({
  token: {
    env: `${envify(name)}_API_TOKEN`,
    name: 'API token'
  }
});

const makeUsernamePassword = name => ({
  username: {
    env: `${envify(name)}_USERNAME`
  },
  password: {
    env: `${envify(name)}_PASSWORD`
  }
});

export const integration = ({
  name,
  login,
  create,
  remove,
  token = true,
  userPass = true,
  others = []
}) => {
  const creds = others.concat.apply(others, [
    token ? makeToken(name) : [],
    userPass ? makeUsernamePassword(name) : []
  ]);
  const auth = makeAuthPrompt(name, creds);
  return {
    [name]: {
      auth,
      login,
      create,
      remove
    }
  };
};
