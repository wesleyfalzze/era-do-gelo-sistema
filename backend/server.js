import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Rota raiz para o Render não dar erro de "Not Found"
app.get('/', (req, res) => {
  res.send('API do Era do Gelo rodando com sucesso! 🧊⚡');
});

// Configuração do Socket.IO para tempo real
io.on('connection', (socket) => {
  console.log(`Novo cliente conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});