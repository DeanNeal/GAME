var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


app.use(express.static(__dirname + '/public'));

app.set('view engine', 'jade');

app.get('/', function(req, res){
  // res.sendFile(__dirname + '/lansflare.html');
  res.render('main');
});




/****LOGIC*****/

var users = [];

io.sockets.on('connection', function (socket) {
    var user = {};

    socket.on('add new player', function(playerOptions){
       user = addUser(socket.id, playerOptions);
       socket.emit("selfPlayer", { users: users, currentPlayer: user });
       io.sockets.emit("otherNewPlayer", { users: users, currentPlayer: user });
       io.sockets.emit('updateUserData', users);
    });

    socket.on('disconnect', function () {
        removeUser(user);
    });
    socket.on("move", function( data ) {
        updateUsersCoords(user.id, data);
    });

    socket.on("updateUserData", function( user ) {
        updateUserData(user);
    });



    socket.on('chat message', function(data){
      io.emit('chat message', data);
    });

});


var addUser = function(id, playerOptions) {
    var user = {
        id: id.slice(0,4),
        playerName: playerOptions.name,
        size: 25,
        position:{
          x: 0,
          y: 0,
          z: 0
        },
        rotation:{},
        scores: 0
    }
    users.push(user);
    //io.sockets.emit("newPlayer", user);
    return user;
}
var removeUser = function(user) {
    for(var i=0; i<users.length; i++) {
        if(user.id === users[i].id) {
            users.splice(i, 1);
            io.sockets.emit("deletePlayer", user.id);
            return;
        }
    }
}
var updateUsersCoords = function(id, data) {

    for(var i=0; i<users.length; i++) {
        var user = users[i];
        if(user.id == id){
          user.position = data.position;
          user.rotation = data.rotation;
        }
    }
    io.sockets.emit("updateUsersCoords", users);
}

var updateUserData = function(data) {
  for(var i=0; i<users.length; i++) {
      if(users[i].id == data.id){
        users[i] = data;
      }
  }
  io.sockets.emit("updateUsersData", users);
}
/****LOGIC*****/


http.listen(8081, process.env.IP);