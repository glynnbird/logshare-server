var cloudant = require('./db.js');
var DB_NAME="logsharestats";
var loggingdb = null;
var loggingMode = false;

// CouchDB Design document
var ddoc = { _id: "_design/find", 
             views: { 
               stats: {
                   map: "function (doc) {\n if (doc.duration) {  \n   var bits = doc.start.split('Z'); \n   var d = bits[0]; \n   var datebits = d.split('-'); \n   var year = parseInt(datebits[0], 10); \n   var month = parseInt(datebits[1], 10); \n   var day = parseInt(datebits[2], 10); \n   emit([year, month, day], [doc.messages, doc.bytes, doc.duration]);\n }\n}",
                   reduce : "_stats"
               },
             }
           };

if (cloudant) {
  var loggingMode = true;
  var couchmigrate = require('./couchmigrate.js');
  loggingdb = cloudant.db.use(DB_NAME);
  
  // set up the databases
  cloudant.db.create(DB_NAME, function(e,d) {
    
    // make sure design documents are in place
    couchmigrate.migrate(DB_NAME, ddoc, function(e, d) {


    });
  });
};

var log = function(doc, callback) {
  if (loggingMode && loggingdb) {
    loggingdb.insert(doc, callback);
  } else {
    callback(null, null);
  }
};


var byYear = function(callback) {
  loggingdb.view('find', 'stats', { group_level: 1}, callback);
};

var byMonth = function(callback) {
  loggingdb.view('find', 'stats', { group_level: 2}, callback);
};

var byDay = function(callback) {
  loggingdb.view('find', 'stats', { group_level: 3}, callback);
}

module.exports = {
  log: log,
  byYear: byYear,
  byMonth: byMonth,
  byDay: byDay
}