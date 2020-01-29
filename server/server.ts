// let express = require('express')
import * as express from 'express';
import { createServer, Server } from 'http';
import { Game } from './game';
import * as path from 'path';
import * as io from 'socket.io';

class GameServer {
  private app: express.Application;
  private server: Server;
  private io: SocketIO.Server;
  private port: string | number = process.env.PORT || 8081;
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = io(this.server);

    this.server.listen(this.port, () => {
      console.log('Running server on port %s', this.port);
    });

    this.app.use(express.static(path.join(__dirname, '../public')))

    this.app.set('view engine', 'html')
    this.app.get('/', function (req, res) {
      res.sendFile(__dirname + '/index.html')
    })

    new Game(this.io);
  }
}

new GameServer();