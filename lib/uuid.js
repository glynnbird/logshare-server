var js = require('../package.json');
var Hashids = require("hashids"),
	hashids = new Hashids(JSON.stringify(js), 0, "abcdefghijklmnopqrstuvwxyz");
var s = new Date('January 1, 2016 00:00:00').getTime();
var i = new Date().getTime() - s;

var generate = function() {
  return hashids.encode(i++);
}    

module.exports = {
  generate: generate
}
