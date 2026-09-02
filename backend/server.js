import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json());

// Pega a URL do MongoDB configurada nas variáveis de ambiente do Render
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "eradogelo";

let db;

// Conexão com o Banco de Dados MongoDB Atlas
if (MONGO_URI) {
  MongoClient.connect(MONGO_URI)
    .then(client => {
      db = client.db(DB_NAME);
      console.log("🗄️ Conectado com sucesso ao Banco de Dados MongoDB!");
    })
    .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));
} else {
  console.warn("⚠️ ATENÇÃO: Variável MONGO_URI não encontrada nas variáveis de ambiente!");
}

// Rota raiz para o Render
app.get('/', (req, res) => {
  res.send('🧊 Era do Gelo - Servidor Backend com MongoDB Rodando com Sucesso! 🚀');
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

  // Envia os pedidos salvos no banco assim que o cliente conecta
  try {
    if (db) {
      const pedidosSalvos = await db.collection('pedidos').find({}).toArray();
      socket.emit('atualizar_lista_pedidos', pedidosSalvos);
    }
  } catch (e) {
    console.error("Erro ao buscar pedidos:", e);
  }

  // Solicitação manual de pedidos
  socket.on('solicitar_pedidos', async () => {
    try {
      if (db) {
        const pedidosSalvos = await db.collection('pedidos').find({}).toArray();
        socket.emit('atualizar_lista_pedidos', pedidosSalvos);
      }
    } catch (e) {
      console.error("Erro ao solicitar pedidos:", e);
    }
  });

  // Salva novo pedido no banco de dados e retransmite para todos
  socket.on('novo_pedido', async (pedido) => {
    try {
      if (db) {
        const existe = await db.collection('pedidos').findOne({ id: pedido.id });
        if (!existe) {
          await db.collection('pedidos').insertOne(pedido);
          console.log(`📦 Novo pedido salvo no MongoDB da ${pedido.local} (${pedido.cliente})`);
        }
      }
      
      io.emit('pedido_recebido', pedido);
      if (db) {
        const listaAtualizada = await db.collection('pedidos').find({}).toArray();
        io.emit('atualizar_lista_pedidos', listaAtualizada);
      }
    } catch (e) {
      console.error("Erro ao salvar novo pedido:", e);
    }
  });

  // Atualiza o status do pedido no banco (Pendente -> Preparando -> Pronto)
  socket.on('atualizar_status_pedido', async ({ idPedido, status }) => {
    try {
      if (db) {
        await db.collection('pedidos').updateOne({ id: idPedido }, { $set: { status } });
      }
      io.emit('status_pedido_atualizado', { idPedido, status });
      if (db) {
        const listaAtualizada = await db.collection('pedidos').find({}).toArray();
        io.emit('atualizar_lista_pedidos', listaAtualizada);
      }
    } catch (e) {
      console.error("Erro ao atualizar status:", e);
    }
  });

  // Cliente solicita o fechamento da conta pelo autoatendimento
  socket.on('solicitar_fechamento', async (localChave) => {
    try {
      if (db) {
        await db.collection('pedidos').updateMany({ local: localChave }, { $set: { contaSolicitada: true } });
        const listaAtualizada = await db.collection('pedidos').find({}).toArray();
        io.emit('atualizar_lista_pedidos', listaAtualizada);
      }
    } catch (e) {
      console.error("Erro ao solicitar fechamento:", e);
    }
  });

  // Fecha e remove a comanda paga do banco de dados
  socket.on('fechar_comanda', async (localChave) => {
    try {
      if (db) {
        await db.collection('pedidos').deleteMany({
          $or: [
            { local: localChave },
            { mesa: localChave.replace('Mesa ', '') }
          ]
        });
        console.log(`🏁 Comanda fechada e removida do MongoDB: ${localChave}`);
      }
      if (db) {
        const listaAtualizada = await db.collection('pedidos').find({}).toArray();
        io.emit('atualizar_lista_pedidos', listaAtualizada);
      }
    } catch (e) {
      console.error("Erro ao fechar comanda:", e);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});