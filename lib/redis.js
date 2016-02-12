var redis = require('node-redis'),
  async = require('async'),
  credentials = require('./bmservice.js').getCredentials(/^Redis by Compose/) || { username: "", password: "", public_hostname: "localhost/6379"};
  bits = credentials.public_hostname.split('/'),
  hostname = bits[0],
  port = parseInt(bits[1]),
  client = redis.createClient(port, hostname, credentials.password);
    
console.log("Connecting to Redis server on", credentials.public_hostname);  
/*
var collect = function() {
  
  client.on("subscribe", function (channel, count) {
    console.log("Subscribed to PubSub channel", queue_name)
  });

  client.on("message", function (channel, message) {
    var obj = JSON.parse(message.toString());
    console.log(obj);
    writer.push(obj, function() {});
  }); 
  
  client.subscribe(queue_name);
}
*/

module.exports = client;