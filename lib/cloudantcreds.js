// get Cloudant credentials
var services = process.env.VCAP_SERVICES
var url = require('url');
var opts = null;

// parse BlueMix config
if (typeof services != 'undefined') {
  services = JSON.parse(services);
  var service = null;
  if (services && services.cloudantNoSQLDB) {
    service = services.cloudantNoSQLDB[0];
    opts = service.credentials;
    opts.account = opts.username;
  
    // get url without creds
    var parsed = url.parse(opts.url);
    delete parsed.auth;
    opts.stub = url.format(parsed);
    console.log("Using Cloudant service",opts.host);
  } 
} 

module.exports = opts;