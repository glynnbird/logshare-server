var opts = require('./cloudantcreds.js');
var cloudant = require('cloudant')(opts);

module.exports = cloudant;