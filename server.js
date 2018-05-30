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
    });

    socket.on('disconnect', function () {
        removeUser(user);
    });
    socket.on("move", function( data ) {
        updateUsersCoords(user.name, data);
    });

    socket.on('chat message', function(data){
      io.emit('chat message', data);
    });

});


var addUser = function(id, playerOptions) {
    var user = {
        name: id.slice(0,4),
        playerName: playerOptions.name,
        size: 25,
        position:{
          x: 0,
          y: 0,
          z: 0
        },
        rotation:{}
    }
    users.push(user);
    //io.sockets.emit("newPlayer", user);
    return user;
}
var removeUser = function(user) {
    for(var i=0; i<users.length; i++) {
        if(user.name === users[i].name) {
            users.splice(i, 1);
            io.sockets.emit("deletePlayer", user.name);
            return;
        }
    }
}
var updateUsersCoords = function(name, data) {

    for(var i=0; i<users.length; i++) {
        var user = users[i];
        if(user.name == name){
          user.position = data.position;
          user.rotation = data.rotation;
        }
    }
    io.sockets.emit("updateUsers", users);
}
/****LOGIC*****/


http.listen(8081, process.env.IP);