let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
io.set('heartbeat timeout', 5000);
io.set('heartbeat interval', 2000);
// let THREE = require('three');

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.get('/', function(req, res) {
    // res.sendFile(__dirname + '/lansflare.html');
    res.render('main');
});


/****LOGIC*****/

let users = [];
let cubes = createCubes();
let asteroids = createAsteroids();

io.sockets.on('connection', function(socket) {
    let user = {
        id: socket.id.slice(0, 4)
    };

    socket.on('add new player', function(playerOptions) {
        addUser(user, playerOptions);
        socket.emit("selfPlayer", user );

        io.sockets.emit("otherNewPlayer", users);
        io.sockets.emit('userList', users);
        socket.emit("updateCubes", cubes);
        socket.emit("updateAsteroids", asteroids);


        setInterval(function(){
            io.sockets.emit("updateUsersCoords", users);
        }, 20);
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

    socket.on("fire", function(bullet) {
       socket.broadcast.emit("otherFire", bullet);
    });

    socket.on("demage", function(userId) {
       decreaseHealth(userId);
    });

    socket.on('chat message', function(data) {
        io.emit('chat message', data);
    });

});


let addUser = function(user, playerOptions) {
    user = Object.assign(user, {
        playerName: playerOptions.name,
        size: 80,
        position: {
            x: 0,
            y: 0,
            z: 0
        },
        rotation: {},
        scores: 0,
        health: 100,
        death: 0

    });
    users.push(user);
    return user;
}
let removeUser = function(user) {
    console.log('deletePlayer', user);
    for (let i = 0; i < users.length; i++) {
        if (user.id === users[i].id) {
            users.splice(i, 1);
            io.sockets.emit("deletePlayer", user.id);
            return;
        }
    }
}
let updateUsersCoords = function(id, data, socket) {

    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        if (user.id == id) {
            user.position = data.position;
            user.rotation = data.rotation;
        }
    }
    // socket.broadcast.emit("updateUsersCoords", users);
    // io.sockets.emit("updateUsersCoords", users);
}

let increaseScores = function(curUser) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].id == curUser.id) {
            // users[i].scores += 1;
            users[i].health = 100;
        }
    }
    io.sockets.emit("userList", users);
}

let decreaseHealth = function(userId) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].id == userId) {
            users[i].health -= 10;
            if(users[i].health <= 0) {
                users[i].health = 100;
                users[i].death++;
            }
        }
    }
    io.sockets.emit("userList", users);
}

/****LOGIC*****/



function getRandColor() {
    let colors = [
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
    let cubes = [];
    for (let i = 0; i < 5; i++) {
        let cube = {};
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

function createAsteroids() {
    let cubes = [];
    for (let i = 0; i < 50; i++) {
        let cube = {};
        cubes.push({
          id: i,
          color: 0xcccccc,//getRandColor(),
          position: {
            x: 20000 * (2.0 * Math.random() - 1.0),
            y: 20000 * (2.0 * Math.random() - 1.0),
            z: 20000 * (2.0 * Math.random() - 1.0)
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
  for (let i = 0; i < cubes.length; i++) {
      if (cube.id === cubes[i].id) {
          io.sockets.emit("cubeWasRemoved", cubes[i]);
          cubes.splice(i, 1);
          return;
      }
  }
}

http.listen(8081, process.env.IP);