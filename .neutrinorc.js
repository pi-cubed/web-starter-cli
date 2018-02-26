module.exports = {
  use: [
    [
      '@neutrinojs/airbnb-base',
      {
        eslint: {
          rules: {
            'arrow-parens': ['error', 'as-needed']
          }
        }
      }
    ],
    [
      '@neutrinojs/library',
      {
        name: 'web-starter-cli',
        target: 'node'
      }
    ],
    '@neutrinojs/jest'
  ]
};
