const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Memória volátil do servidor para guardar os pedidos ativos
let pedidosGlobais = [];

io.on('connection', (socket) => {
  console.log(`🔌 Novo cliente conectado: ${socket.id}`);

  // Envia a lista atual de pedidos assim que o cliente conecta
  socket.emit('atualizar_lista_pedidos', pedidosGlobais);

  // Cliente solicita pedidos explicitamente
  socket.on('solicitar_pedidos', () => {
    socket.emit('atualizar_lista_pedidos', pedidosGlobais);
  });

  // Recebe novo pedido de qualquer cliente/garçom e retransmite para todos
  socket.on('novo_pedido', (pedido) => {
    // Evita duplicatas
    if (!pedidosGlobais.some(p => p.id === pedido.id)) {
      pedidosGlobais.unshift(pedido);
    }
    console.log(`📦 Novo pedido recebido da ${pedido.local} (${pedido.cliente})`);
    
    // Envia para todos os outros (e cozinha/gestor)
    io.emit('pedido_recebido', pedido);
    io.emit('atualizar_lista_pedidos', pedidosGlobais);
  });

  // Atualiza status do pedido (Preparando, Pronto, etc.)
  socket.on('atualizar_status_pedido', ({ idPedido, status }) => {
    pedidosGlobais = pedidosGlobais.map(p => p.id === idPedido ? { ...p, status } : p);
    io.emit('status_pedido_atualizado', { idPedido, status });
    io.emit('atualizar_lista_pedidos', pedidosGlobais);
  });

  // Fecha comanda da mesa
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