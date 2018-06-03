var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
// var THREE = require('three');

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'jade');

app.get('/', function(req, res) {
    // res.sendFile(__dirname + '/lansflare.html');
    res.render('main');
});




/****LOGIC*****/

var users = [];
var cubes = createCubes();

io.sockets.on('connection', function(socket) {
    var user = {};

    socket.on('add new player', function(playerOptions) {
        user = addUser(socket.id, playerOptions);
        socket.emit("selfPlayer", { users: users, currentPlayer: user });
        io.sockets.emit("otherNewPlayer", { users: users, currentPlayer: user });
        // io.sockets.emit('updateUserData', users);
        socket.emit("updateCubes", cubes);
    });

    socket.on('disconnect', function() {
        removeUser(user);
    });
    socket.on("move", function(data) {
        updateUsersCoords(user.id, data);
    });

    socket.on("increaseScores", function() {
        increaseScores(user);
    });

    socket.on("removeCube", function(cube) {
        removeCube(cube);
    });

    socket.on("startAgain", function(cube) {
        cubes = createCubes();
        setTimeout(function(){
          socket.emit("updateCubes", cubes);
        }, 5000);
    });

    socket.on('chat message', function(data) {
        io.emit('chat message', data);
    });

});


var addUser = function(id, playerOptions) {
    var user = {
        id: id.slice(0, 4),
        playerName: playerOptions.name,
        size: 25,
        position: {
            x: 0,
            y: 0,
            z: 0
        },
        rotation: {},
        scores: 0
    }
    users.push(user);
    //io.sockets.emit("newPlayer", user);
    return user;
}
var removeUser = function(user) {
    for (var i = 0; i < users.length; i++) {
        if (user.id === users[i].id) {
            users.splice(i, 1);
            io.sockets.emit("deletePlayer", user.id);
            return;
        }
    }
}
var updateUsersCoords = function(id, data) {

    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        if (user.id == id) {
            user.position = data.position;
            user.rotation = data.rotation;
        }
    }
    io.sockets.emit("updateUsersCoords", users);
}

var increaseScores = function(curUser) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].id == curUser.id) {
            users[i].scores += 1;
        }
    }
    io.sockets.emit("updateUsersData", users);
}

// var updateUserData = function(data) {
//   for(var i=0; i<users.length; i++) {
//       if(users[i].id == data.id){
//         users[i] = data;
//       }
//   }
//   io.sockets.emit("updateUsersData", users);
// }
/****LOGIC*****/



function getRandColor() {
    var colors = [
        '#FF62B0',
        '#9A03FE',
        '#62D0FF',
        '#48FB0D',
        '#DFA800',
        '#C27E3A',
        '#990099',
        '#9669FE',
        '#23819C',
        '#01F33E',
        '#B6BA18',
        '#FF800D',
        '#B96F6F',
        '#4A9586'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}


function createCubes() {
    var cubes = [];
    for (var i = 0; i < 5; i++) {
        var cube = {};
        cubes.push({
          id: i,
          color: getRandColor(),
          position: {
            x: 5000 * (2.0 * Math.random() - 1.0),
            y: 5000 * (2.0 * Math.random() - 1.0),
            z: 5000 * (2.0 * Math.random() - 1.0)
          },
          rotation: {
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            z: Math.random() * Math.PI
          }
        });
    }

    return cubes;
}

function removeCube(cube) {
  for (var i = 0; i < cubes.length; i++) {
      if (cube.id === cubes[i].id) {
          io.sockets.emit("cubeWasRemoved", cubes[i]);
          cubes.splice(i, 1);
          return;
      }
  }
}

http.listen(8081, process.env.IP);