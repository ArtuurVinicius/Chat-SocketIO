const express = require('express')
const http = require('http')
const socketIo = require('socket.io')

const app = express()

const server = http.createServer(app)

const io = socketIo(server)

io.on("connection", socket => {
  console.log("Usuário conectado", socket.id)
  socket.on("message", msg => {
    console.log(msg)
    io.emit("message", msg)
  })
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/chat-socketio.html')
})

// aqui vai o socketIo

server.listen(3000)