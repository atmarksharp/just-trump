
/**
 * Module dependencies.
 */

var suits = "s,h,d,c".split(",");
var nums = "1,2,3,4,5,6,7,8,9,10,j,q,k".split(",");

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();

cards = {}
users = {}

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

  console.log("connection");

  socket.on('message', function(data) {

    for(key in data){
      if(cards[key] !== undefined && cards[key].reserved_by !== undefined && cards[key].reserved_by != 0){
        data[key].reserved_by = cards[key].reserved_by
      }
    }

    var dat = {}
    console.log("message");
    dat.user = users[socket.id];
    dat.value = data;

    for(key in data){
      if(!cards[key]) cards[key] = {};
      cards[key].offset = data[key]["offset"];
      cards[key].z_index = data[key]["z_index"];
      cards[key].face = data[key]["face"];
      if(data[key]["reserved_by_sender"]){
        console.log("RESERVED !!!!!!!");
        cards[key].reserved_by = users[socket.id].id;
      }else{
        if(cards[key].reserved_by !== undefined &&  cards[key].reserved_by == users[socket.id].id){
          console.log("RESERVED CANCELED !!!!!!!");
          cards[key].reserved_by = 0;
        }
      }
    }

    socket.broadcast.emit('message', dat);
  });

  socket.on('unselect', function(data) {
    var dat = {}
    dat.user = users[socket.id];
    dat.value = data;
    socket.broadcast.emit('unselect', dat)
  });

  socket.on('add_user', function(data) {
    console.log("connection ID is " + data.id + ", bonded to " + socket.id);
    users[socket.id] = data;
    socket.emit("init", {users: users, value: cards});
    socket.broadcast.emit('new_user_entry', {user: data});
  });

  socket.on('shuffle', function(data) {
    console.log("shuffle");
    socket.broadcast.emit('shuffle', {value: data});

    for(key in data){
      if(!cards[key]) cards[key] = {};
      cards[key].visual = data[key]["visual"];
    }
  });

  socket.on('disconnect', function () {
    if(!users[socket.id]){
      return;
    }
    console.log("connection ID: " + users[socket.id].id + " was disconnected");

    for(key in cards){
      if(cards[key].reserved_by !== undefined && cards[key].reserved_by == users[socket.id].id){
        cards[key].reserved_by = 0;
        cards[key].face = 0;
        console.log("card.reserved_by cleared");
      }
    }

    var dat = {}
    dat.user = users[socket.id];
    socket.broadcast.emit('user_disconnect', dat)

    delete users[socket.id];
  });
});