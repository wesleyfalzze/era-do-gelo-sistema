/**
 * ============================================================================
 * PACOTE 1: IMPORTAÇÕES E CONFIGURAÇÕES DE AMBIENTE
 * ============================================================================
 */
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

let db = null;
let dbConectado = false;

/**
 * ============================================================================
 * PACOTE 2: GERENCIAMENTO E TESTE DE CONEXÃO COM O BANCO DE DADOS
 * ============================================================================
 */
async function conectarBancoDados() {
  try {
    if (!MONGO_URI) {
      throw new Error("Variável MONGO_URI não está definida no ambiente.");
    }
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
    dbConectado = true;
    console.log("🗄️ [SUCESSO] Conectado ao MongoDB Atlas com sucesso!");
  } catch (erro) {
    dbConectado = false;
    console.error("❌ [ERRO] Falha na função conectarBancoDados:", erro.message);
  }
}

conectarBancoDados();

// Endpoint de verificação de status do banco de dados
app.get('/api/status', (req, res) => {
  try {
    res.json({ conectado: dbConectado, timestamp: new Date() });
  } catch (erro) {
    res.status(500).json({ conectado: false, erro: erro.message });
  }
});

app.get('/', (req, res) => {
  res.send('🧊 Era do Gelo - Servidor Modular Rodando com Sucesso! 🚀');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

/**
 * ============================================================================
 * PACOTE 3: GERENCIAMENTO DE ROTAS E SOCKET.IO (EVENTOS EM TEMPO REAL)
 * ============================================================================
 */
io.on('connection', (socket) => {
  console.log(`🔌 Novo cliente conectado: ${socket.id}`);

  // Função: Sincronizar dados iniciais com o cliente conectado
  async function enviarDadosIniciais() {
    try {
      if (!db || !dbConectado) return;
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
    } catch (erro) {
      console.error("❌ [ERRO] Função enviarDadosIniciais:", erro.message);
    }
  }

  enviarDadosIniciais();

  // Função: Salvar Cardápio
  socket.on('salvar_cardapio', async (novoCardapio) => {
    try {
      if (db && dbConectado) {
        await db.collection('cardapio').deleteMany({});
        if (novoCardapio.length > 0) await db.collection('cardapio').insertMany(novoCardapio);
      }
      io.emit('atualizar_cardapio', novoCardapio);
    } catch (erro) {
      console.error("❌ [ERRO] Função salvar_cardapio:", erro.message);
    }
  });

  // Função: Salvar Usuários do Banco
  socket.on('salvar_usuarios', async (novaLista) => {
    try {
      if (db && dbConectado) {
        await db.collection('usuarios').deleteMany({});
        if (novaLista.length > 0) await db.collection('usuarios').insertMany(novaLista);
      }
      io.emit('atualizar_usuarios', novaLista);
    } catch (erro) {
      console.error("❌ [ERRO] Função salvar_usuarios:", erro.message);
    }
  });

  // Função: Salvar Configuração de Impressoras
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
    } catch (erro) {
      console.error("❌ [ERRO] Função salvar_config_impressora:", erro.message);
    }
  });

  // Função: Salvar Cliente por Celular
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
    } catch (erro) {
      console.error("❌ [ERRO] Função salvar_cliente:", erro.message);
    }
  });

  // Função: Criar Novo Pedido
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
    } catch (erro) {
      console.error("❌ [ERRO] Função novo_pedido:", erro.message);
    }
  });

  // Função: Atualizar Status do Pedido / Entrega / Cancelamento
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
    } catch (erro) {
      console.error("❌ [ERRO] Função atualizar_status_pedido:", erro.message);
    }
  });

  // Função: Fechar Comanda e Registrar Venda
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
    } catch (erro) {
      console.error("❌ [ERRO] Função fechar_comanda:", erro.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor modular rodando na porta ${PORT}`);
});