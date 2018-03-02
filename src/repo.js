const { Repository } = require('nodegit');

const init = name =>
  Repository.init(name, false).then(repository => {
    // Use repository
    console.log(repository);
  });

export default init;
