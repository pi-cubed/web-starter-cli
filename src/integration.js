const inquirer = require('inquirer');
const Promise = require('bluebird');

export const merge = o1 => o2 => {
  return Object.assign(o1, o2);
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

// can't refactor to just Object.assign ?
const mergeList = l => l.reduce((x, y) => Object.assign(x, y), {});

const makeCredentials = (name, creds) => vals => ({
  [name]: mergeList(
    Object.keys(creds).map(key => ({
      [key]: process.env[creds[key].env] || vals[key]
    }))
  )
});

const makeLogin = (name, creds) => () => {
  const credentials = makeCredentials(name, mergeList(creds));
  const prompt = makePrompt(name);
  return creds
    .map(credList => {
      const keys = Object.keys(credList);
      const isMissing = key => !(credList[key].env in process.env);
      const missingCreds = keys.filter(isMissing);
      if (missingCreds.length === 0) {
        return credentials({});
      } else if (missingCreds.length < keys.length) {
        // prompt for missing credentials
        return Promise.reduce(
          missingCreds,
          (all, key) =>
            prompt(credList[key].name || key)
              .then(a => ({ [key]: a }))
              .then(merge(all)),
          {}
        ).then(credentials);
      }
      return null;
    })
    .find(x => x); // TODO prompt if no env vars found
};

export const integration = (name, create, remove, creds) => {
  const login = makeLogin(name, creds);
  return {
    name,
    login,
    create,
    remove
  };
};
