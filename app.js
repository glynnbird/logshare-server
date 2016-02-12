var express = require('express'),
   cfenv = require('cfenv'),
   moment = require('moment'),
   async = require('async');

// create a new express server
var app = express();
var bodyParser = require('body-parser');
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// other libraries service
var redis = require('./lib/redis.js');
var uuid = require('./lib/uuid.js');
var stub = "logshare_";

// create a new database, make it world read/write
app.get('/start', function(req,res) {
  var id = uuid.generate();
  var channelname = stub + id;
  var metaname = channelname + "_meta";
  var meta = { start: moment().format(), end: null, messages: 0, bytes: 0 };
  redis.hset(metaname, 'start', moment().format());
  redis.hset(metaname, 'messages', 0);
  redis.hset(metaname, 'bytes', 0);
  
  res.send({ ok: true, 
             id: id, 
             shareurl: appEnv.url + '/share/' + id, 
             channelname: channelname});
});

// create a new database, make it world read/write
app.post('/publish/:id', bodyParser.urlencoded(), function(req,res) {
  if (!req.params.id) {
    return res.status(404).send({ok: false, err: "invalid token"});
  }
  if (typeof req.body.body == 'undefined' || req.body.body.length == 0) {
    return res.status(404).send({ok: false, err: "no body parameter found"});
  }
  var body = req.body.body;
  var channelname = stub + req.params.id;
  var metaname = channelname + "_meta";
  redis.exists(metaname, function (err, data) {
    redis.publish(channelname, body);
    redis.hincrby(metaname, 'messages', 1);
    redis.hincrby(metaname, 'bytes', body.length);
    res.send({ ok: true});
  });

});

// delete the database
app.get('/stop/:id', function(req,res) {
  if (!req.params.id) {
    return res.status(404);
  }
  var channelname = stub + req.params.id;
  var metaname = channelname + "_meta";
  redis.hgetall(metaname, function(err, data) {
    if (err || data.length == 0) {
      return res.status(404).send({ok: false});
    } else {
      var obj = {};
      for (var i=0; i < data.length; i+=2) {
        var key = data[i].toString('utf8');
        var value = data[i+1].toString('utf8');
        if (value.match(/^[0-9]+$/)) {
          value = parseInt(value);
        }
        obj[key] = value;
      }
      console.log(obj);
      redis.del(metaname);
      res.send({ok: true, id: req.query.id})
    }
  })

  
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
