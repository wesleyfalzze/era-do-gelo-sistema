const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE"]
  }
});

// Banco de dados em memória (Cardápio inicial)
let cardapio = [
  { id: 1, nome: 'Espetinho de Boi', descricao: 'Carne macia temperada na brasa', preco: 12.00, categoria: 'Espetinhos' },
  { id: 2, nome: 'Espetinho de Frango com Bacon', descricao: 'Frango suculento envolvido em bacon crocante', preco: 14.00, categoria: 'Espetinhos' },
  { id: 3, nome: 'Espetinho de Picanha', descricao: 'Cortes nobres de picanha', preco: 18.00, categoria: 'Espetinhos' },
  { id: 4, nome: 'Pão de Alho', descricao: 'Recheado com pasta de alho especial', preco: 8.00, categoria: 'Acompanhamentos' },
  { id: 5, nome: 'Mandioca Cozida', descricao: 'Mandioca macia na manteiga de garrafa', preco: 15.00, categoria: 'Porções' },
  { id: 6, nome: 'Refrigerante Lata', descricao: 'Coca-Cola, Guaraná ou Sprite',preco: 6.00, categoria: 'Bebidas' },
  { id: 7, nome: 'Cerveja Gelada 600ml', descricao: 'Litrão estupidamente gelado', preco: 12.00, categoria: 'Bebidas' }
];

// Rota raiz para o Render não exibir "Not Found"
app.get('/', (req, res) => {
  res.send('API do Era do Gelo rodando com sucesso! 🧊⚡');
});

// Rotas do Cardápio
app.get('/api/cardapio', (req, res) => {
  res.json(cardapio);
});

app.post('/api/cardapio', (req, res) => {
  const { nome, descricao, preco, categoria } = req.body;
  const novoItem = {
    id: Date.now(),
    nome,
    descricao,
    preco,
    categoria
  };
  cardapio.push(novoItem);
  io.emit('cardapio_atualizado', cardapio);
  res.status(201).json(novoItem);
});

app.delete('/api/cardapio/:id', (req, res) => {
  const { id } = req.params;
  cardapio = cardapio.filter(item => item.id != id);
  io.emit('cardapio_atualizado', cardapio);
  res.json({ mensagem: 'Item excluído com sucesso!' });
});

// Socket.io para Pedidos em Tempo Real
io.on('connection', (socket) => {
  console.log('⚡ Um cliente se conectou:', socket.id);

  socket.on('novo_pedido', (pedido) => {
    const pedidoCompleto = {
      id: Date.now(),
      ...pedido,
      status: 'Em preparo'
    };
    io.emit('pedido_recebido', pedidoCompleto);
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});