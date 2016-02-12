$( document ).ready(function() {
  
  var url = dburl;
  console.log(url);
  var db = new PouchDB(url);
  db.changes({
    since: 'now',
    live: true,
    include_docs: true
  }).on('change', function (change) {
    // received a change
    $('.logs').append(change.doc.body + "\n")
  }).on('error', function (err) {
    // handle errors
  });
});