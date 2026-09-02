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
let dbConectado = false;

// Teste de conexão automático na inicialização
if (MONGO_URI) {
  MongoClient.connect(MONGO_URI)
    .then(client => {
      db = client.db(DB_NAME);
      dbConectado = true;
      console.log("🗄️ [SUCESSO] Conectado ao MongoDB Atlas com sucesso!");
    })
    .catch(err => {
      dbConectado = false;
      console.error("❌ [ERRO] Falha ao conectar ao MongoDB:", err);
    });
} else {
  console.warn("⚠️ [AVISO] Variável MONGO_URI não encontrada!");
}

// Endpoint para testar o status da conexão com o banco
app.get('/api/status', (req, res) => {
  res.json({ conectado: dbConectado, timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('🧊 Era do Gelo - Servidor Completo com Banco de Dados Rodando! 🚀');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', async (socket) => {
  console.log(`🔌 Novo cliente conectado: ${socket.id}`);

  try {
    if (db && dbConectado) {
      const pedidosSalvos = await db.collection('pedidos').find({}).toArray();
      const cardapioSalvo = await db.collection('cardapio').find({}).toArray();
      const usuariosSalvos = await db.collection('usuarios').find({}).toArray();
      const vendasSalvas = await db.collection('vendas').find({}).toArray();
      const clientesSalvos = await db.collection('clientes').find({}).toArray();
      const configImpressora = await db.collection('configuracoes').findOne({ tipo: 'impressora' });

      socket.emit('atualizar_lista_pedidos', pedidosSalvos);
      socket.emit('atualizar_cardapio', cardapioSalvo);
      socket.emit('atualizar_usuarios', usuariosSalvos);
      socket.emit('atualizar_vendas', vendasSalvas);
      socket.emit('atualizar_clientes', clientesSalvos);
      if (configImpressora) socket.emit('atualizar_config_impressora', configImpressora);
    }
  } catch (e) {
    console.error("Erro ao buscar dados iniciais:", e);
  }

  // Sincronizar Cardápio (com Impressora/Cozinha atrelada)
  socket.on('salvar_cardapio', async (novoCardapio) => {
    try {
      if (db && dbConectado) {
        await db.collection('cardapio').deleteMany({});
        if (novoCardapio.length > 0) await db.collection('cardapio').insertMany(novoCardapio);
      }
      io.emit('atualizar_cardapio', novoCardapio);
    } catch (e) { console.error(e); }
  });

  // Sincronizar Usuários do Banco
  socket.on('salvar_usuarios', async (novaLista) => {
    try {
      if (db && dbConectado) {
        await db.collection('usuarios').deleteMany({});
        if (novaLista.length > 0) await db.collection('usuarios').insertMany(novaLista);
      }
      io.emit('atualizar_usuarios', novaLista);
    } catch (e) { console.error(e); }
  });

  // Salvar Configuração de Impressora Direta
  socket.on('salvar_config_impressora', async (config) => {
    try {
      if (db && dbConectado) {
        await db.collection('configuracoes').updateOne(
          { tipo: 'impressora' },
          { $set: { tipo: 'impressora', ...config } },
          { upsert: true }
        );
      }
      io.emit('atualizar_config_impressora', config);
      console.log(`🖨️ Configuração de impressora salva: ${config.caminho}`);
    } catch (e) { console.error(e); }
  });

  // Salvar Cliente (Celular ➔ Nome)
  socket.on('salvar_cliente', async ({ celular, nome }) => {
    try {
      if (db && dbConectado && celular && nome) {
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
      if (db && dbConectado) {
        const existe = await db.collection('pedidos').findOne({ id: pedido.id });
        if (!existe) await db.collection('pedidos').insertOne(pedido);
      }
      io.emit('pedido_recebido', pedido);
      if (db && dbConectado) {
        const listaAtualizada = await db.collection('pedidos').find({}).toArray();
        io.emit('atualizar_lista_pedidos', listaAtualizada);
      }
    } catch (e) { console.error(e); }
  });

  // Atualizar Status / Entrega / Cancelamento
  socket.on('atualizar_status_pedido', async (dadosAtualizados) => {
    try {
      if (db && dbConectado) {
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

  // Fechar Comanda e Salvar Venda
  socket.on('fechar_comanda', async ({ localChave, registroVenda }) => {
    try {
      if (db && dbConectado) {
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