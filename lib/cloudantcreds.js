// get Cloudant credentials
var services = process.env.VCAP_SERVICES
var url = require('url');
if (!services) {
  throw("Could not find a VCAP_SERVICES environment variable");
}
var opts = null;

// parse BlueMix config
if (typeof services != 'undefined') {
  services = JSON.parse(services);
  var service = null;
  if (!services || !services.cloudantNoSQLDB) {
    throw("Could not find any attached cloudantNoSQLDB services")
  }
  service = services.cloudantNoSQLDB[0];
  opts = service.credentials;
  opts.account = opts.username;
  
  // get url without creds
  var parsed = url.parse(opts.url);
  delete parsed.auth;
  opts.stub = url.format(parsed);
  console.log("Using Cloudant service",opts.host);
} 

module.exports = opts;