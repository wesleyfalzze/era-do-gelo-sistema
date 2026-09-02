import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "eradogelo";

let db;

if (MONGO_URI) {
  MongoClient.connect(MONGO_URI)
    .then(client => {
      db = client.db(DB_NAME);
      console.log("🗄️ Conectado com sucesso ao Banco de Dados MongoDB!");
    })
    .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));
} else {
  console.warn("⚠️ ATENÇÃO: Variável MONGO_URI não encontrada!");
}

app.get('/', (req, res) => {
  res.send('🧊 Era do Gelo - Servidor Completo com MongoDB Rodando com Sucesso! 🚀');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', async (socket) => {
  console.log(`🔌 Novo cliente conectado: ${socket.id}`);

  try {
    if (db) {
      const pedidosSalvos = await db.collection('pedidos').find({}).toArray();
      const cardapioSalvo = await db.collection('cardapio').find({}).toArray();
      const usuariosSalvos = await db.collection('usuarios').find({}).toArray();
      const vendasSalvas = await db.collection('vendas').find({}).toArray();
      const clientesSalvos = await db.collection('clientes').find({}).toArray();

      socket.emit('atualizar_lista_pedidos', pedidosSalvos);
      socket.emit('atualizar_cardapio', cardapioSalvo);
      socket.emit('atualizar_usuarios', usuariosSalvos);
      socket.emit('atualizar_vendas', vendasSalvas);
      socket.emit('atualizar_clientes', clientesSalvos);
    }
  } catch (e) {
    console.error("Erro ao buscar dados iniciais:", e);
  }

  // Sincronizar Cardápio
  socket.on('salvar_cardapio', async (novoCardapio) => {
    try {
      if (db) {
        await db.collection('cardapio').deleteMany({});
        if (novoCardapio.length > 0) await db.collection('cardapio').insertMany(novoCardapio);
      }
      io.emit('atualizar_cardapio', novoCardapio);
    } catch (e) { console.error(e); }
  });

  // Sincronizar Usuários
  socket.on('salvar_usuarios', async (novaLista) => {
    try {
      if (db) {
        await db.collection('usuarios').deleteMany({});
        if (novaLista.length > 0) await db.collection('usuarios').insertMany(novaLista);
      }
      io.emit('atualizar_usuarios', novaLista);
    } catch (e) { console.error(e); }
  });

  // Salvar / Atualizar Clientes (Celular ➔ Nome)
  socket.on('salvar_cliente', async ({ celular, nome }) => {
    try {
      if (db && celular && nome) {
        await db.collection('clientes').updateOne(
          { celular },
          { $set: { celular, nome, updatedAt: new Date() } },
          { upsert: true }
        );
        const clientesAtualizados = await db.collection('clientes').find({}).toArray();
        io.emit('atualizar_clientes', clientesAtualizados);
      }
    } catch (e) { console.error(e); }
  });

  // Novo Pedido
  socket.on('novo_pedido', async (pedido) => {
    try {
      if (db) {
        const existe = await db.collection('pedidos').findOne({ id: pedido.id });
        if (!existe) await db.collection('pedidos').insertOne(pedido);
      }
      io.emit('pedido_recebido', pedido);
      if (db) {
        const listaAtualizada = await db.collection('pedidos').find({}).toArray();
        io.emit('atualizar_lista_pedidos', listaAtualizada);
      }
    } catch (e) { console.error(e); }
  });

  // Atualizar Status do Pedido / Entrega / Cancelamento
  socket.on('atualizar_status_pedido', async (dadosAtualizados) => {
    try {
      if (db) {
        await db.collection('pedidos').updateOne(
          { id: dadosAtualizados.idPedido },
          { 
            $set: { 
              status: dadosAtualizados.status,
              entregue: dadosAtualizados.entregue,
              garcomEntrega: dadosAtualizados.garcomEntrega || null,
              horarioEntrega: dadosAtualizados.horarioEntrega || null,
              cancelado: dadosAtualizados.cancelado || false,
              motivoCancelamento: dadosAtualizados.motivoCancelamento || null
            } 
          }
        );
        const listaAtualizada = await db.collection('pedidos').find({}).toArray();
        io.emit('atualizar_lista_pedidos', listaAtualizada);
      }
    } catch (e) { console.error(e); }
  });

  // Solicitar Fechamento
  socket.on('solicitar_fechamento', async (localChave) => {
    try {
      if (db) {
        await db.collection('pedidos').updateMany({ local: localChave }, { $set: { contaSolicitada: true } });
        const listaAtualizada = await db.collection('pedidos').find({}).toArray();
        io.emit('atualizar_lista_pedidos', listaAtualizada);
      }
    } catch (e) { console.error(e); }
  });

  // Fechar Comanda e Gravar Venda
  socket.on('fechar_comanda', async ({ localChave, registroVenda }) => {
    try {
      if (db) {
        if (registroVenda) await db.collection('vendas').insertOne(registroVenda);
        await db.collection('pedidos').deleteMany({
          $or: [
            { local: localChave },
            { mesa: localChave.replace('Mesa ', '') }
          ]
        });

        const listaPedidos = await db.collection('pedidos').find({}).toArray();
        const listaVendas = await db.collection('vendas').find({}).toArray();

        io.emit('atualizar_lista_pedidos', listaPedidos);
        io.emit('atualizar_vendas', listaVendas);
      }
    } catch (e) { console.error(e); }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});