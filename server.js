let express = require('express')
let app = express()
let http = require('http').Server(app)
let io = require('socket.io')(http)
io.set('heartbeat timeout', 5000)
io.set('heartbeat interval', 2000)
// let THREE = require('three');

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'html')
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
  // res.render('index.html');
})

/****LOGIC*****/

let users = []
let runes = createRunes()
let asteroids = createAsteroids()

setInterval(function () {
  io.sockets.emit('updateUsersCoords', users)
}, 10)

io.sockets.on('connection', function (socket) {
  let user = {
    id: socket.id.slice(0, 4),
    _id: socket.id
  }

  io.sockets.emit('online', users.length)

  socket.on('addNewPlayer', function (playerOptions) {
    addUser(user, playerOptions)
    // socket.emit("userInit", user );
    socket.emit('userCreated', user)

    io.sockets.emit('anotherNewPlayer', users)
    io.sockets.emit('userList', users)
    socket.emit('updateRunes', runes)
    socket.emit('updateAsteroids', asteroids)

    io.sockets.emit('online', users.length)
  })

  socket.on('disconnect', function () {
    removeUser(user)
    io.sockets.emit('online', users.length)
  })
  socket.on('move', function (data, log) {
    updateUsersCoords(user.id, data)
  })

  // socket.on("increaseScores", function() {
  //     increaseScores(user);
  // });

  socket.on('removeRune', function (rune) {
    removeRune(rune)
  })

  socket.on('startAgain', function (rune) {
    setTimeout(function () {
      runes = createRunes()
      socket.emit('updateRunes', runes)
    }, 6000);
  })

  socket.on('fire', function (bullet) {
    socket.broadcast.emit('otherFire', bullet)
  })

  socket.on('damage', function (userDemaged, userDamaging) {
    decreaseHealth(userDemaged._id, userDamaging._id)
  })

  socket.on('damageToAsteroid', function(asteroid) {
    removeAsteroid(asteroid.id);
  });

  socket.on('outsideZone', function(user) {
    for (let i = 0; i < users.length; i++) {
      if (users[i]._id == user._id) {
            users[i].health -= 10
            if(users[i].health <= 0) {
                users[i].health = 100
                io.sockets
                .to(user._id)
                .emit('killed', {
                  position: randomPosition(),
                  rotation: randomRotation()
                })
            } else {
              io.sockets.to(user._id).emit('gotDamage', users[i])
            }
      }
    }
    io.sockets.emit('userList', users)
  });

  // socket.on('chat message', function(data) {
  //     io.emit('chat message', data);
  // });
})

let addUser = function (user, playerOptions) {
  user = Object.assign(user, {
    playerName: playerOptions.name,
    // color: playerOptions.color,
    shipType: playerOptions.shipType,
    size: 80,
    position: randomPosition(),
    rotation: randomRotation(),
    // scores: 0,
    kills: 0,
    health: 100,
    death: 0
  })
  users.push(user)
  return user
}
let removeUser = function (user) {
  // console.log('deletePlayer', user);
  for (let i = 0; i < users.length; i++) {
    if (user.id === users[i].id) {
      users.splice(i, 1)
      io.sockets.emit('deletePlayer', user.id)
      io.sockets.emit('userList', users)
      return
    }
  }
}
let updateUsersCoords = function (id, data, socket) {
  for (let i = 0; i < users.length; i++) {
    let user = users[i]
    if (user.id == id) {
      user.position = data.position
      user.rotation = data.rotation
    }
  }
  // socket.broadcast.emit("updateUsersCoords", users);
  // io.sockets.emit("updateUsersCoords", users);
}

let decreaseHealth = function (userDemagedId, userDemagingId) {
  for (let i = 0; i < users.length; i++) {
    if (users[i]._id == userDemagedId) {
      users[i].health -= 10

      if (users[i].health <= 0) {
        users[i].health = 100
        users[i].death++

        io.sockets
          .to(userDemagedId)
          .emit('killed', {
            position: randomPosition(),
            rotation: randomRotation()
          })
        users.find(r => r._id === userDemagingId).kills += 1
      }

      io.sockets.to(userDemagedId).emit('gotDamage', users[i])
    }
  }
  io.sockets.emit('userList', users)
}

/****LOGIC*****/

function getRandColor () {
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
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

function createRunes () {
  let runes = []
  for (let i = 0; i < 30; i++) {
    runes.push({
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
    })
  }

  return runes
}

function createAsteroids () {
  let asteroids = []
  for (let i = 0; i < 100; i++) {
    asteroids.push({
      health: 100,
      size: randomInteger(5, 20),
      id: i,
      // color: 0xcccccc,
      position: {
        x: 60000 * (2.0 * Math.random() - 1.0),
        y: 60000 * (2.0 * Math.random() - 1.0),
        z: 60000 * (2.0 * Math.random() - 1.0)
      },
      rotation: {
        x: Math.random() * Math.PI,
        y: Math.random() * Math.PI,
        z: Math.random() * Math.PI
      }
    })
  }

  return asteroids
}

function removeRune (rune) {
  for (let i = 0; i < runes.length; i++) {
    if (rune.id === runes[i].id) {
      io.sockets.emit('runeWasRemoved', runes[i])
      runes.splice(i, 1)
      return
    }
  }
}

function removeAsteroid(id) {
  for (let i = 0; i < asteroids.length; i++) {
    if (id === asteroids[i].id) {
      asteroids[i].health -= 20;
      if(asteroids[i].health <= 0) {
        io.sockets.emit('asteroidWasRemoved', asteroids[i])
        asteroids.splice(i, 1)
      }
      return
    }
  }
}

function randomPosition () {
  return {
    // x: 0, //2500 * (5.0 * Math.random() - 1.0),
    // y: 0, //2500 * (5.0 * Math.random() - 1.0),
    // z: 0 //2500 * (5.0 * Math.random() - 1.0)
    x: 2500 * (5.0 * Math.random() - 1.0),
    y: 2500 * (5.0 * Math.random() - 1.0),
    z: 2500 * (5.0 * Math.random() - 1.0)
  }
}

function randomRotation () {
  return {
    x: randomDecemal(0, Math.PI),
    y: randomDecemal(0, Math.PI),
    z: randomDecemal(0, Math.PI)
  }
}

function randomInteger (min, max) {
  // получить случайное число от (min-0.5) до (max+0.5)
  let rand = min - 0.5 + Math.random() * (max - min + 1)
  return Math.round(rand)
}

function randomDecemal (from, to) {
  return (Math.random() * (to - from) + from).toFixed(4)
}

http.listen(process.env.PORT || 8081, '0.0.0.0' || process.env.IP)
