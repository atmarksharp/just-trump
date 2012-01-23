
/**
 * Module dependencies.
 */

var suits = "s,h,d,c".split(",");
var nums = "1,2,3,4,5,6,7,8,9,10,j,q,k".split(",");

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();

cards = {}

// for(var i=0; i<4; i++){
//   for(var j=0; j<13; j++){
//     cards[suits[i]+"-"+nums[j]] = {
//
//     };
//   }
// }

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);


var port = process.env.PORT || 3000;
app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var socketIO = require('socket.io');
var io = socketIO.listen(app);

io.sockets.on('connection', function(socket) {
  socket.emit("init",cards);

  console.log("connection");

  socket.on('message', function(data) {
    console.log("message");
    socket.broadcast.emit('message', data);

    for(key in data){
      if(!cards[key]) cards[key] = {};
      cards[key].offset = data[key]["offset"];
      cards[key].z_index = data[key]["z_index"];
      cards[key].face = data[key]["face"];
    }
  });

  socket.on('shuffle', function(data) {
    console.log("shuffle");
    socket.broadcast.emit('shuffle', data);

    for(key in data){
      if(!cards[key]) cards[key] = {};
      cards[key].visual = data[key]["visual"];
    }
  });
});