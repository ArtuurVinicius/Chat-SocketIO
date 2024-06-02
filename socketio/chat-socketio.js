const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const session = require("express-session");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const API =
  "https://a621d81c-110b-47d4-a0a0-109c9de72737-00-2e87akalqv5ld.spock.replit.dev";
const viacep =
  "https://feb2862c-c88d-43fa-8c57-baca91a6c4c5-00-aheq4dqze7hl.picard.replit.dev/";

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secreto",
    resave: false,
    saveUninitialized: true,
  }),
);

app.use("/css", express.static(path.join(__dirname, "css")));

const users = {};

io.on("connection", (socket) => {
  console.log("Usuário conectado", socket.id);

  socket.on("username", (username) => {
    users[socket.id] = username;
    socket.broadcast.emit("message", `"${username}" entrou no chat`);
    socket.emit("play-audio", "cash");
  });

  socket.on("message", (msg) => {
    console.log(msg);
    const messageWithUsername = `${users[socket.id]}: ${msg}`;
    io.emit("message", messageWithUsername);

    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes("auuuuu")) {
      io.emit("play-audio", "auuuuu");
    } else if (lowerMsg.includes("atumalaca")) {
      io.emit("play-audio", "atumalaca");
    } else if (lowerMsg.includes("tome")) {
      io.emit("play-audio", "tome");
    } else if (lowerMsg.includes(`img cat`)) {
      fetch(`${API}/gato`)
        .then((res) => res.json())
        .then((data) => {
          io.emit(
            "message",
            `${users[socket.id]}: <img src="${data}" width="300" height="300">`,
          );
        });
    } else if (lowerMsg.includes(`img dog`)) {
      fetch(`${API}/dog`)
        .then((res) => res.json())
        .then((data) => {
          io.emit(
            "message",
            `${users[socket.id]}: <img src="${data}" width="300" height="300">`,
          );
        });
    } else if (lowerMsg.startsWith("mtg ")) {
      const cardname = msg.slice(4).trim();
      fetch(`${API}/mtg?cardname=${encodeURIComponent(cardname)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            io.emit(
              "message",
              `${users[socket.id]}: <img src="${data}" width="300" height="420">`,
            );
          } else {
            io.emit("message", `${users[socket.id]}: Card not found`);
          }
        })
        .catch((error) => {
          console.error("Error fetching the card image:", error);
          io.emit(
            "message",
            `${users[socket.id]}: Error fetching the card image`,
          );
        });
    } else if (lowerMsg.startsWith("cep ")) {
      const cep = msg.slice(4).trim();
      fetch(`${viacep}/cep/${cep}`)
        .then((res) => res.text()) // Use text() para inspecionar a resposta bruta
        .then((text) => {
          try {
            const data = JSON.parse(text); // Tente parsear o texto como JSON
            if (data && data.logradouro) {
              const endereco = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
              io.emit("message", `${users[socket.id]}: ${endereco}`);
            } else {
              io.emit("message", `${users[socket.id]}: CEP não encontrado.`);
            }
          } catch (error) {
            console.error("Erro ao consultar CEP:", error);
            console.error("Resposta recebida:", text); // Log da resposta bruta
            io.emit("message", `${users[socket.id]}: Erro ao consultar CEP.`);
          }
        })
        .catch((error) => {
          console.error("Erro ao consultar CEP:", error);
          io.emit("message", `${users[socket.id]}: Erro ao consultar CEP.`);
        });
    } else if (lowerMsg.startsWith("rua ")) {
      const parts = msg.slice(4).trim().split(" ");
      if (parts.length >= 3) {
        const uf = parts[0];
        const cidade = parts.slice(1, parts.length - 1).join(" ");  // Junta todas as partes exceto a última como cidade
        const rua = parts[parts.length - 1];  // Última parte como rua
        fetch(`${viacep}/rua/${uf}/${encodeURIComponent(cidade)}/${encodeURIComponent(rua)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.length > 0) {
              
              const endereco = data.map(end =>`\n<p> ${end.cep}, ${end.logradouro}, ${end.bairro}, ${end.localidade} - ${end.uf}\n<p>`).join("\n");
              io.emit("message", `${users[socket.id]}: ${endereco}`);
            } else {
              io.emit("message", `${users[socket.id]}: Endereço não encontrado.`);
            }
          })
          .catch((error) => {
            console.error("Erro ao consultar endereço:", error);
            io.emit("message", `${users[socket.id]}: Erro ao consultar endereço.`);
          });
      } else {
        io.emit("message", `${users[socket.id]}: Formato inválido. Use: rua UF cidade rua.`);
      }
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/chat-login.html");
});

app.post("/chat", (req, res) => {
  const username = req.body.username;
  req.session.username = username;
  res.redirect("/chat");
});

app.get("/chat", (req, res) => {
  if (!req.session.username) {
    return res.redirect("/");
  }
  res.sendFile(__dirname + "/chat-socketio.html");
});

app.get("/session-username", (req, res) => {
  res.json({ username: req.session.username });
});

app.get("/sounds/:audio", (req, res) => {
  const audioFile = req.params.audio;
  res.sendFile(path.join(__dirname, "sounds", audioFile));
});

server.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
