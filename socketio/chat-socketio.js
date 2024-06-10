const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const session = require("express-session");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const API =
  "https://a621d81c-110b-47d4-a0a0-109c9de72737-00-2e87akalqv5ld.spock.replit.dev"
const viacep =
  "https://feb2862c-c88d-43fa-8c57-baca91a6c4c5-00-aheq4dqze7hl.picard.replit.dev/"
const CRUD =
  "https://c43f2d09-4ca1-4257-a8cb-5e6d97411bb8-00-2ir59x0jujtgu.kirk.replit.dev/api/pessoas"
const urlOpenAI = "https://69a9d945-11ca-4394-a519-7873177de5ff-00-25jvbrl87p7y1.janeway.replit.dev:3000"

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
        .then((res) => res.text())
        .then((text) => {
          try {
            const data = JSON.parse(text); 
            if (data && data.logradouro) {
              const endereco = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
              io.emit("message", `${users[socket.id]}: ${endereco}`);
            } else {
              io.emit("message", `${users[socket.id]}: CEP não encontrado.`);
            }
          } catch (error) {
            console.error("Erro ao consultar CEP:", error);
            console.error("Resposta recebida:", text);
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
        const cidade = parts.slice(1, parts.length - 1).join(" "); 
        const rua = parts[parts.length - 1]; 
        fetch(
          `${viacep}/rua/${uf}/${encodeURIComponent(cidade)}/${encodeURIComponent(rua)}`,
        )
          .then((res) => res.json())
          .then((data) => {
            if (data && data.length > 0) {
              const endereco = data
                .map(
                  (end) =>
                    `\n<p> ${end.cep}, ${end.logradouro}, ${end.bairro}, ${end.localidade} - ${end.uf}\n<p>`,
                )
                .join("\n");
              io.emit("message", `${users[socket.id]}: ${endereco}`);
            } else {
              io.emit(
                "message",
                `${users[socket.id]}: Endereço não encontrado.`,
              );
            }
          })
          .catch((error) => {
            console.error("Erro ao consultar endereço:", error);
            io.emit(
              "message",
              `${users[socket.id]}: Erro ao consultar endereço.`,
            );
          });
      } else {
        io.emit(
          "message",
          `${users[socket.id]}: Formato inválido. Use: rua UF cidade rua.`,
        );
      }
    } else if (lowerMsg.startsWith("get pessoas")) {
      fetch(CRUD)
        .then((res) => res.json())
        .then((data) => {
          const pessoas = data
            .map(
              (p) =>
                `<p>ID: ${p.id}, Nome: ${p.nome}, Idade: ${p.idade}, CPF: ${p.cpf}, Email: ${p.email}, Sexo: ${p.sexo}</p>`,
            )
            .join("\n");
          io.emit("message", `${users[socket.id]}: ${pessoas}`);
        })
        .catch((error) => {
          console.error("Erro ao buscar pessoas:", error);
          io.emit("message", `${users[socket.id]}: Erro ao buscar pessoas.`);
        });
    } else if (lowerMsg.startsWith("get pessoa ")) {
      const id = lowerMsg.split(" ")[2];
      console.log("id pessoa:", id);
      fetch(`${CRUD}/${id}`)
        .then((res) => res.json())
        .then((data) => {
          const pessoa = `<p>ID: ${data.id}, Nome: ${data.nome}, Idade: ${data.idade}, CPF: ${data.cpf}, Email: ${data.email}, Sexo: ${data.sexo}</p>`;
          io.emit("message", `${users[socket.id]}: ${pessoa}`);
        })
        .catch((error) => {
          console.error("Erro ao buscar pessoa:", error);
          io.emit("message", `${users[socket.id]}: Erro ao buscar pessoa.`);
        });
    } else if (lowerMsg.startsWith("post pessoa ")) {
      const parts = msg.slice(12).trim().split(",");
      if (parts.length === 5) {
        const [nome, idade, cpf, email, sexo] = parts.map((p) => p.trim());
        fetch(CRUD, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, idade, cpf, email, sexo }),
        })
          .then((res) => res.json())
          .then((data) => {
            io.emit(
              "message",
              `${users[socket.id]}: Pessoa criada com sucesso! ID: ${data.id}`,
            );
          })
          .catch((error) => {
            console.error("Erro ao criar pessoa:", error);
            io.emit("message", `${users[socket.id]}: Erro ao criar pessoa.`);
          });
      } else {
        io.emit(
          "message",
          `${users[socket.id]}: Formato inválido. Use: post pessoa nome, idade, cpf, email, sexo.`,
        );
      }
    } else if (lowerMsg.startsWith("patch pessoa ")) {
      const parts = msg.slice(13).trim().split(",");
      if (parts.length === 6) {
        const id = parts[0].trim();
        const [nome, idade, cpf, email, sexo] = parts
          .slice(1)
          .map((p) => p.trim());
        fetch(`${CRUD}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, idade, cpf, email, sexo }),
        })
          .then(() => {
            io.emit(
              "message",
              `${users[socket.id]}: Pessoa atualizada com sucesso!`,
            );
          })
          .catch((error) => {
            console.error("Erro ao atualizar pessoa:", error);
            io.emit(
              "message",
              `${users[socket.id]}: Erro ao atualizar pessoa.`,
            );
          });
      } else {
        io.emit(
          "message",
          `${users[socket.id]}: Formato inválido. Use: patch pessoa id, nome, idade, cpf, email, sexo.`,
        );
      }
    } else if (lowerMsg.startsWith("delete pessoa ")) {
      const id = lowerMsg.split(" ")[2];
      fetch(`${CRUD}/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          io.emit(
            "message",
            `${users[socket.id]}: Pessoa deletada com sucesso!`,
          );
        })
        .catch((error) => {
          console.error("Erro ao deletar pessoa:", error);
          io.emit("message", `${users[socket.id]}: Erro ao deletar pessoa.`);
        });
    } else if (lowerMsg.startsWith("chatgpt ")) {
      const prompt = msg.slice(8).trim();
      fetch(`${urlOpenAI}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })
        .then((res) => res.json())
        .then((data) => {
          io.emit("message", `gepeto: ${data.response}`);
        })
        .catch((error) => {
          console.error("Erro ao comunicar com a API de ChatGPT:", error);
          io.emit(
            "message",
            `${users[socket.id]}: Erro ao comunicar com a API de ChatGPT.`,
          );
        });
    } else if (lowerMsg.startsWith("dalle ")) {
        const prompt = msg.slice(6).trim();
        console.log("prompt: " + prompt);
        fetch(`${urlOpenAI}/gptImage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("data: ", data);
            
            io.emit("message", `${users[socket.id]}: <img src="${data.imageUrl}" width="300" height="300">`);
          })
          .catch((error) => {
            console.error("Erro ao comunicar com a API de ChatGPT:", error);
            io.emit(
              "message",
              `${users[socket.id]}: Erro ao comunicar com a API de ChatGPT.`
            );
          });
          

    }
    else {
      io.emit("message", `${users[socket.id]}: Comando não reconhecido.`);
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
