const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'secreto',
  resave: false,
  saveUninitialized: true
}));

app.use('/css', express.static(path.join(__dirname, 'css')));

const users = {};

io.on("connection", socket => {
  console.log("Usuário conectado", socket.id);

  socket.on("username", username => {
    users[socket.id] = username;
    socket.broadcast.emit("message", `"${username}" entrou no chat`);
    socket.emit("play-audio", 'cash'); 
  });

  socket.on("message", msg => {
    console.log(msg);
    const messageWithUsername = `${users[socket.id]}: ${msg}`;
    io.emit("message", messageWithUsername);

    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes("auuuuu")) {
      io.emit("play-audio", 'auuuuu');
    } else if (lowerMsg.includes("atumalaca")) {
      io.emit("play-audio", 'atumalaca');
    } else if(lowerMsg.includes("tome")) {
      io.emit("play-audio", 'tome');
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/chat-login.html");
});

app.post("/chat", (req, res) => {
  const username = req.body.username;
  req.session.username = username;
  res.redirect('/chat');
});

app.get('/chat', (req, res) => {
  if (!req.session.username) {
    return res.redirect('/');
  }
  res.sendFile(__dirname + '/chat-socketio.html');
});

app.get('/session-username', (req, res) => {
  res.json({ username: req.session.username });
});

app.get('/sounds/:audio', (req, res) => {
  const audioFile = req.params.audio;
  res.sendFile(path.join(__dirname, 'sounds', audioFile));
});

server.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
