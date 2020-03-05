const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const routes = require('./routes');
const config = require('config');
const app = express();
const socketIo = require('socket.io');
const http = require('http');

// app;
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', socket => {
  console.log(socket.handshake.address + ' Connected');

  socket.on('disconnect', () => console.log('Client disconnected'));
});

app.use((req, res, next) => {
  res.io = io;
  next();
});

app.disable('x-powered-by');

app.use(express.json());

mongoose.connect(
  config.get('DBURL'),
  {
    useFindAndModify: false,
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  err => {
    if (err) {
      console.log('Error Connecting Database');
      console.log(err);
      process.exit(1);
    }
    console.log('DB Connected');
  }
);
app.get('/', (req, res) => {
  res.send({ message: config.get('dburl') });
});
app.use('/user', routes.user);
app.use('/admin', routes.admin);

let port1 = process.env.PORT || 3001;
let port2 = process.env.PORT || 4001;

app.listen(port1, 'localhost', err => {
  if (err) console.log(err);
});

server.listen(port2, () => console.log(`Listening on port ${port2}`));
