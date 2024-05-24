const wbs = require('ws')
const http = require('http')
const fs = require('fs')

const server = http.createServer((req, res) => {
  file = fs.readFileSync('./websocket/chat-websocket.html')
  res.end(file)
})

const ws = new wbs.Server({ server })

ws.on("connection", skt => {
  skt.on("message", msg => {
    console.log(msg.toString('utf-8'))
    ws.clients.forEach(client => {
      client.send(msg)
    })
  })
})

server.listen(3000)