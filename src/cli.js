const _ = require('lodash');
const tokenImporter = require('./index');

const options = _.includes(process.argv, '--convertCase')
  ? { convertCase: true }
  : {};

module.exports = tokenImporter(options);
