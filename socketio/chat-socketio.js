const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'secreto',
  resave: false,
  saveUninitialized: true
}));

const users = {};

io.on("connection", socket => {
  console.log("Usuário conectado", socket.id);

  socket.on("username", username => {
    users[socket.id] = username;
    socket.broadcast.emit("message", `"${username}" entrou no chat`)
  });

  socket.on("message", msg => {
    console.log(msg);
    const messageWithUsername = `${users[socket.id]}: ${msg}`;
    io.emit("message", messageWithUsername);
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


server.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
