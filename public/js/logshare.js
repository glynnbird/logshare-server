$( document ).ready(function() {
  
  var url = document.URL;
  url = url.replace(/\/share\/.*$/,'');
  console.log("url",url);
  console.log("id",logshareid);
  var socket = io.connect(url);

  socket.emit('subscribe', { id: logshareid});
  socket.on('data', function(data) {
    $('.logs').append(data + "\n")
  });  
});