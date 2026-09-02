import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

// Rota raiz para o Render não dar erro de "Cannot GET /"
app.get('/', (req, res) => {
  res.send('🧊 Era do Gelo - Servidor Backend Rodando com Sucesso! 🚀');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let pedidosGlobais = [];

io.on('connection', (socket) => {
  console.log(`🔌 Novo cliente conectado: ${socket.id}`);

  socket.emit('atualizar_lista_pedidos', pedidosGlobais);

  socket.on('solicitar_pedidos', () => {
    socket.emit('atualizar_lista_pedidos', pedidosGlobais);
  });

  socket.on('novo_pedido', (pedido) => {
    if (!pedidosGlobais.some(p => p.id === pedido.id)) {
      pedidosGlobais.unshift(pedido);
    }
    console.log(`📦 Novo pedido recebido da ${pedido.local} (${pedido.cliente})`);
    
    io.emit('pedido_recebido', pedido);
    io.emit('atualizar_lista_pedidos', pedidosGlobais);
  });

  socket.on('atualizar_status_pedido', ({ idPedido, status }) => {
    pedidosGlobais = pedidosGlobais.map(p => p.id === idPedido ? { ...p, status } : p);
    io.emit('status_pedido_atualizado', { idPedido, status });
    io.emit('atualizar_lista_pedidos', pedidosGlobais);
  });

  socket.on('fechar_comanda', (localChave) => {
    pedidosGlobais = pedidosGlobais.filter(p => {
      let chave = p.local;
      if (!chave && p.mesa && p.mesa !== 'Avulso') {
        chave = `Mesa ${String(p.mesa).padStart(2, '0')}`;
      } else if (!chave) {
        chave = 'Avulso';
      }
      return chave !== localChave;
    });
    console.log(`🏁 Comanda fechada: ${localChave}`);
    io.emit('atualizar_lista_pedidos', pedidosGlobais);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});