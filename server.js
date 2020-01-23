let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
io.set('heartbeat timeout', 5000);
io.set('heartbeat interval', 2000);
// let THREE = require('three');

app.use(express.static(__dirname + '/src'));
app.set('view engine', 'html');
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
    // res.render('index.html');
});


/****LOGIC*****/

let users = [];
let cubes = createCubes();
let asteroids = createAsteroids();

setInterval(function(){
    io.sockets.emit("updateUsersCoords", users);
}, 20);

io.sockets.on('connection', function(socket) {
    let user = {
        id: socket.id.slice(0, 4),
        _id: socket.id,
        initPosition: randomPosition(),
        initRotation: randomRotation()
    };

    socket.on('addNewPlayer', function(playerOptions) {
        addUser(user, playerOptions);
        socket.emit("userInit", user );
        socket.emit("userUpdated", user );

        io.sockets.emit("otherNewPlayer", users);
        io.sockets.emit('userList', users);
        socket.emit("updateCubes", cubes);
        socket.emit("updateAsteroids", asteroids);
    });

    socket.on('disconnect', function() {
        removeUser(user);
    });
    socket.on("move", function(data, log) {

        updateUsersCoords(user.id, data);
    });

    socket.on("increaseScores", function() {
        increaseScores(user);
    });

    socket.on("removeCube", function(cube) {
        removeCube(cube);
    });

    socket.on("startAgain", function(cube) {
        setTimeout(function(){
            cubes = createCubes();
            socket.emit("updateCubes", cubes);
        }, 5000);
    });

    socket.on("fire", function(bullet) {
       socket.broadcast.emit("otherFire", bullet);
    });

    socket.on("damage", function(user) {
       decreaseHealth(user._id);
    });

    socket.on('chat message', function(data) {
        io.emit('chat message', data);
    });

});


let addUser = function(user, playerOptions) {
    user = Object.assign(user, {
        playerName: playerOptions.name,
        color: playerOptions.color,
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
    // console.log('deletePlayer', user);
    for (let i = 0; i < users.length; i++) {
        if (user.id === users[i].id) {
            users.splice(i, 1);
            io.sockets.emit("deletePlayer", user.id);
            io.sockets.emit("userList", users);
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
            users[i].scores += 1;
            // users[i].health = 100;
        }
    }
    io.sockets.emit("userList", users);
}

let decreaseHealth = function(userId) {
    for (let i = 0; i < users.length; i++) {
        if (users[i]._id == userId) {
          
            users[i].health -= 10;
            // console.log(user);
      
            if(users[i].health <= 0) {
                users[i].health = 100;
                users[i].death++;
               
                io.sockets.to(userId).emit("gameOver", {position: randomPosition(), rotation: randomRotation()});
            }

            io.sockets.to(userId).emit("gotDamage", users[i]);
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
    for (let i = 0; i < 3; i++) {

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
    let asteroids = [];
    for (let i = 0; i < 50; i++) {
      
        asteroids.push({
          id: i,
          color: 0xcccccc,
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

    return asteroids;
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


function randomPosition() {
    return {
        x: 2500 * (5.0 * Math.random() - 1.0),
        y: 2500 * (5.0 * Math.random() - 1.0),
        z: 2500 * (5.0 * Math.random() - 1.0)
    }
}

function randomRotation() {
    return {
        x: Math.random(),
        y: Math.random(),
        z: Math.random()
    }
}

http.listen(8081, process.env.IP);