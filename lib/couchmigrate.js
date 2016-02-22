var async = require('async'),
  cloudant = require('./db.js'),
  debug = require('debug')('logshare');


var writedoc = function(db, obj, docid, cb) {
  var preexistingdoc = null;
  async.series([
    function(callback) {
      debug("couchmigrate - writedoc - Looking for pre-existing", docid);
      db.get(docid, function(err, data) {
        debug(err, data);
        if (!err) {
          preexistingdoc = data;
        }
        callback(null, data);
      })
    },
    function(callback) {
      obj._id = docid;
      if (preexistingdoc) {
        obj._rev = preexistingdoc._rev
      }
      debug("couchmigrate - writedoc - Writing doc", obj);
      db.insert(obj, function(err, data) {
        debug(err, data);
        callback(null, data);
      });
    }
  ], cb)
};


var clone = function(x) {
  return JSON.parse(JSON.stringify(x));
};


var migrate = function(dbname, dd, callback) {
  
  // this is the whole design document
  var db = cloudant.db.use(dbname);
  var dd_name = dd._id;
  delete dd._rev;

  async.series( [

    // check that the existing view isn't the same as the incoming view
    function(callback) {
      db.get(dd_name, function(err, data) {
        if (err) {
          return callback(null, null);
        };
        var a = clone(data);
        var b = clone(dd);
        delete a._rev;
        delete a._id;
        delete b._rev;
        delete b._id;
        if (JSON.stringify(a) == JSON.stringify(b)) {
          debug("couchmigrate - The design document is the same, no need to migrate! **");
          callback(true ,null);
        } else {
          callback(null, null);
        }
      })
    },
  
    // write new design document to _NEW
    function(callback) {
      debug("couchmigrate - write new design document to ");
      writedoc(db, dd, dd_name, callback)
    }
  
  ], function(err, data) {
    debug("couchmigrate - FINISHED!!!");
    callback(err, data);
  });

};


module.exports = {
  migrate: migrate
}