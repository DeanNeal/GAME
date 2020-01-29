interface Vector3 {
   x: number;
   y: number;
   z: number;
}


interface IUser {
   id: string;
   _id: string;
   health: number;
   death: number;
   kills: number;
   position: Vector3;
   rotation: Vector3;
}

interface IRune {
   id: string;
   position: Vector3;
   rotation: Vector3;
}

interface IAsteroid {
   id: string;
   health: number;
   size: number;
   position: Vector3;
   rotation: Vector3;
}

export class Game {
   private io: SocketIO.Server;
   private users: IUser[] = [];
   private runes: IRune[] = [];
   private asteroids: IAsteroid[] = [];
   constructor(io) {
      this.io = io;

      setInterval(() => {
         this.io.sockets.emit('updateUsersCoords', this.users)
      }, 10)

      this.runes = this.createRunes();
      this.asteroids = this.createAsteroids();

      this.connection();
   }

   connection() {
      this.io.sockets.on('connection', (socket) => {
         let user = {
            id: socket.id.slice(0, 4),
            _id: socket.id
         }

         this.io.sockets.emit('online', this.users.length)

         socket.on('addNewPlayer', (playerOptions) => {
            this.addUser(user, playerOptions)
            // socket.emit("userInit", user );
            socket.emit('userCreated', user)

            this.io.sockets.emit('anotherNewPlayer', this.users)
            this.io.sockets.emit('userList', this.users)
            socket.emit('updateRunes', this.runes)
            socket.emit('updateAsteroids', this.asteroids)

            this.io.sockets.emit('online', this.users.length)
         })

         socket.on('disconnect', () => {
            this.removeUser(user)
            this.io.sockets.emit('online', this.users.length)
         })
         socket.on('move', (data, log) => {
            this.updateUsersCoords(user.id, data)
         })

         // socket.on("increaseScores", function() {
         //     increaseScores(user);
         // });

         socket.on('removeRune', (rune) => {
            this.removeRune(rune)
         })

         // socket.on('startAgain', (rune) => {
         //    setTimeout(function () {
         //       this.runes = this.createRunes()
         //       socket.emit('updateRunes', this.runes)
         //    }, 6000);
         // })

         socket.on('fire', (bullet) => {
            socket.broadcast.emit('otherFire', bullet)
         })

         socket.on('damage', (userDemaged, userDamaging) => {
            this.decreaseHealth(userDemaged._id, userDamaging._id)
         })

         socket.on('damageToAsteroid', (asteroid) => {
            this.removeAsteroid(asteroid.id);
         });

         socket.on('outsideZone', (user) => {
            for (let i = 0; i < this.users.length; i++) {
               if (this.users[i]._id == user._id) {
                  this.users[i].health -= 10
                  if (this.users[i].health <= 0) {
                     this.users[i].health = 100
                     this.users[i].death++;

                     this.io.sockets
                        .to(user._id)
                        .emit('dead', {
                           position: Game.randomPosition(),
                           rotation: Game.randomRotation()
                        })

                  }

                  this.io.sockets.to(user._id).emit('gotDamage', this.users[i])
               }
            }
            this.io.sockets.emit('userList', this.users)
         });
      })
   }


   addUser(user, playerOptions) {
      user = Object.assign(user, {
         playerName: playerOptions.name,
         // color: playerOptions.color,
         shipType: playerOptions.shipType,
         // size: 80,
         position: Game.randomPosition(),
         rotation: Game.randomRotation(),
         // scores: 0,
         kills: 0,
         health: 100,
         death: 0
      })
      this.users.push(user)
      return user
   }

   removeUser(user) {
      // console.log('deletePlayer', user);
      for (let i = 0; i < this.users.length; i++) {
         if (user.id === this.users[i].id) {
            this.users.splice(i, 1)
            this.io.sockets.emit('deletePlayer', user.id)
            this.io.sockets.emit('userList', this.users)
            return
         }
      }
   }

   decreaseHealth(userDemagedId, userDemagingId) {
      for (let i = 0; i < this.users.length; i++) {
         if (this.users[i]._id == userDemagedId) {
            this.users[i].health -= 10

            if (this.users[i].health <= 0) {
               this.users[i].health = 100
               this.users[i].death++

               this.io.sockets
                  .to(userDemagedId)
                  .emit('dead', {
                     position: Game.randomPosition(),
                     rotation: Game.randomRotation()
                  })
               this.users.find(r => r._id === userDemagingId).kills += 1
            }

            this.io.sockets.to(userDemagedId).emit('gotDamage', this.users[i])
         }
      }
      this.io.sockets.emit('userList', this.users)
   }



   updateUsersCoords(id, data) {
      for (let i = 0; i < this.users.length; i++) {
         let user = this.users[i]
         if (user.id == id) {
            user.position = data.position
            user.rotation = data.rotation
         }
      }
   }


   removeRune(rune: IRune) {
      const r = this.runes.find(r => r.id === rune.id);
      this.io.sockets.emit('runeWasRemoved', r);
      this.runes = this.runes.filter(r => r.id !== rune.id);

      if (this.runes.length === 0) {
         setTimeout(() => {
            this.runes = this.createRunes();
            this.io.sockets.emit('updateRunes', this.runes);
         }, 3000);
      }
   }

   removeAsteroid(id) {
      for (let i = 0; i < this.asteroids.length; i++) {
         if (id === this.asteroids[i].id) {
            this.asteroids[i].health -= 20;
            if (this.asteroids[i].health <= 0) {
               this.io.sockets.emit('asteroidWasRemoved', this.asteroids[i])
               this.asteroids.splice(i, 1)
            }
            return
         }
      }
   }

   createAsteroids() {
      let asteroids = []
      for (let i = 0; i < 100; i++) {
         asteroids.push({
            health: 100,
            size: Game.randomInteger(5, 20),
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

   createRunes() {
      let runes = [];
      for (let i = 0; i < 1; i++) {
         runes.push({
            id: i,
            // color: getRandColor(),
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

   static randomPosition() {
      return {
         x: 2500 * (5.0 * Math.random() - 1.0),
         y: 2500 * (5.0 * Math.random() - 1.0),
         z: 2500 * (5.0 * Math.random() - 1.0)
      }
   }

   static randomRotation() {
      return {
         x: this.randomDecemal(0, Math.PI),
         y: this.randomDecemal(0, Math.PI),
         z: this.randomDecemal(0, Math.PI)
      }
   }

   static randomInteger(min: number, max: number) {
      let rand = min - 0.5 + Math.random() * (max - min + 1)
      return Math.round(rand)
   }

   static randomDecemal(from: number, to: number) {
      return (Math.random() * (to - from) + from).toFixed(4)
   }

}



// /****LOGIC*****/

// function getRandColor() {
//    let colors = [
//       '#FF62B0',
//       '#9A03FE',
//       '#62D0FF',
//       '#48FB0D',
//       '#DFA800',
//       '#C27E3A',
//       '#990099',
//       '#9669FE',
//       '#23819C',
//       '#01F33E',
//       '#B6BA18',
//       '#FF800D',
//       '#B96F6F',
//       '#4A9586'
//    ]
//    return colors[Math.floor(Math.random() * colors.length)]
// }
