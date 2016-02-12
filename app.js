var express = require('express'),
   cfenv = require('cfenv'),
   moment = require('moment'),
   debug = require('debug')('logshare'),
   async = require('async');

// create a new express server
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// other libraries service
var redis = require('./lib/redis.js')();
var redispubsub = require('./lib/redis.js')();
var uuid = require('./lib/uuid.js');
var stub = "logshare_";
var livesockets = {};

// subscribe to all changes
redispubsub.psubscribe(stub+"*");

// create a new database, make it world read/write
app.get('/start', function(req,res) {
  debug('GET /start');
  var id = uuid.generate();
  var channelname = stub + id;
  var metaname = channelname + "_meta";
  var meta = { start: moment().format(), end: null, messages: 0, bytes: 0 };
  redis.hset(metaname, 'start', moment().format());
  redis.hset(metaname, 'messages', 0);
  redis.hset(metaname, 'bytes', 0);
  debug('New token',id);
  res.send({ ok: true, 
             id: id, 
             shareurl: appEnv.url + '/share/' + id, 
             channelname: channelname});
});

// create a new database, make it world read/write
app.post('/publish/:id', bodyParser.urlencoded(), function(req,res) {
  debug('POST /publish/:id');
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
    if (err || data == 0) {
      debug("Invalid token", req.params.id)
      return res.status(404).send({ok: false, err: "invalid token"});      
    }
    redis.publish(channelname, body);
    redis.hincrby(metaname, 'messages', 1);
    redis.hincrby(metaname, 'bytes', body.length);
    debug("Published", body.length, "bytes to", req.params.id);
    res.send({ ok: true});
  });

});

// delete the database
app.get('/stop/:id', function(req,res) {
  debug('POST /stop/:id');
  if (!req.params.id) {
    return res.status(404);
  }
  var channelname = stub + req.params.id;
  var metaname = channelname + "_meta";
  redis.hgetall(metaname, function(err, data) {
    if (err || Object.keys(data).length == 0) {
      debug('Invalid token', req.params.id);
      return res.status(404).send({ok: false});
    } else {
      data.end=moment().format();
      debug("Stopped", req.params.id, data);
      redis.del(metaname);
      redispubsub.unsubscribe(channelname);
      res.send({ok: true, id: req.query.id})
    }
  });
});

app.get('/share/:id', function(req,res) {
  debug('GET /share/:id');
  var channelname = stub + req.params.id;
  var metaname = channelname + "_meta";
  redis.exists(metaname, function (err, data) {
    if (err || data == 0) {
      debug('Invalid token', req.params.id);
      return res.status(404).send({ok: false, err: "invalid token"});      
    }
    res.render('share', { id: req.params.id });
  });
});

app.get('/', function(req,res) {
  debug('GET /');
  res.render('index', { id: req.params.id });
});

io.on('connection', function (socket) {
  debug("Socket.io: New connection", socket.id);

  // when it subscribes
  socket.on('subscribe', function (data) {
    if (!data || !data.id) {
      return;
    }
    var channelname = stub + data.id;
    var metaname = channelname + "_meta";
    redis.exists(metaname, function (err, d) {
      if (err || d == 0) {
        socket.emit("baddata", { id: data.id});
        debug("Socket.io: Invalid subscribe request", data.id)
        return;      
      }
      socket.channelname = channelname
      livesockets[socket.id] = socket;
      debug("Socket.io: New livesocket request", socket.id, "(", Object.keys(livesockets).length, ")")      
    });
  });
  
  // when it dies
  socket.on('disconnect', function(reason) {
    debug("Socket.io: disconnect", socket.id)
    for(var i in livesockets) {
      var s = livesockets[i];
      if (s.id == socket.id) {
        delete livesockets[i];
        debug("Socket.io: Deleted livesocket", socket.id, "(", Object.keys(livesockets).length, ")")      
      }
    }
  });
});

// subscribe to all logshare_* messages
redispubsub.on('pmessage',function(pattern, channel, data) {
  debug("Redis: pmessage on channel", channel)
  for(var i in livesockets) {
    var s = livesockets[i];
    if (s.channelname == channel) {
      debug("Socket.io sending to socket", s.id)
      s.emit('data', data); 
    }
  }
});

// start server on the specified port and binding host
server.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
