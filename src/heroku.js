const Heroku = require('heroku-client');

const heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN });

exports = module.exports = name =>
  heroku.post('/apps', { body: { name } }).catch(e => {
    throw `Heroku error: ${e.body.message}`;
  });
