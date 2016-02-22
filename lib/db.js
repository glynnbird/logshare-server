var opts = require('./cloudantcreds.js');
var cloudant = null;

if (opts) {
  var cloudant = require('cloudant')(opts);
}

module.exports = cloudant;