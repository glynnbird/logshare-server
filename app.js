var express = require('express'),
   cfenv = require('cfenv'),
   async = require('async');

// create a new express server
var app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// other libraries service
var cloudant = require('./lib/db.js');
var cloudantcreds = require('./lib/cloudantcreds.js');
var uuid = require('./lib/uuid.js');
var stub = "logshare_";

// create a new database, make it world read/write
app.get('/start', function(req,res) {
  var id = uuid.generate();
  var dbname = stub + id;
  var mydb = cloudant.db.use(dbname);
  async.series([
    function(callback) {
      cloudant.db.create(dbname, callback);
    },
    function(callback) {
      mydb.set_security({ nobody: ['_reader', '_writer'] }, callback);
    }
  ], function(err, data) {
    if (err) {
      res.status(404).send({ok:false, error: err});
    } else {
      res.send({ ok: true, 
                 id: id, 
                 shareurl: appEnv.url + '/share/' + id, 
                 dburl: cloudantcreds.stub,
                 dbname: stub + id});
    } 
  });
});

// create a new database, make it world read/write
app.get('/monitor/:id', function(req,res) {
  var dbname = stub + req.params.id;
  cloudant.db.get(dbname, function(err, data) {
    if (err) {
      res.status(404).send({ok:false, error: "invalid share token"});
    } else {
      res.send({ id: req.params.id, 
                 dburl: cloudantcreds.stub,
                 dbname: dbname });
    }
  })
});

// delete the database
app.get('/stop', function(req,res) {
  if (!req.query.id) {
    return res.status(404);
  }
  cloudant.db.destroy(stub + req.query.id, function(err, data) {
    if (err) {
      res.status(404).send({ok:false, error: "invalid share token"});
    } else {
      res.send({ok: true, id: req.query.id})
    }
  });
});

app.get('/share/:id', function(req,res) {
  var dbname = stub + req.params.id;
  cloudant.db.get(dbname, function(err, data) {
    if (err) {
      res.status(404).send({ok:false, error: "invalid share token"});
    } else {
      res.render('share', { id: req.params.id, dburl: cloudantcreds.stub + dbname });
    }
  })
});

app.get('/', function(req,res) {
  res.render('index', { id: req.params.id });
});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
