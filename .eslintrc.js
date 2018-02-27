const { Neutrino } = require('neutrino');

exports = module.exports = Neutrino()
  .use('.neutrinorc.js')
  .call('eslintrc');
