/**
 * ============================================================================
 * PACOTE 1: IMPORTAÇÕES, CONFIGURAÇÕES DE AMBIENTE E INICIALIZAÇÃO DO SERVIDOR
 * ============================================================================
 */
import { MongoClient, ServerApiVersion } from 'mongodb';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORTA = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

/**
 * ============================================================================
 * PACOTE 2: CONEXÃO COM O MONGODB ATLAS (COM SUPORTE SSL/TLS SEGURO)
 * ============================================================================
 */
let db = null;
let dbConectado = false;

const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  tlsAllowInvalidCertificates: true
});

async function conectarBancoDados() {
  try {
    await client.connect();
    db = client.db('eradogelo');
    dbConectado = true;
    console.log("🗄️ [SUCESSO] Conectado ao MongoDB Atlas com segurança SSL/TLS!");
  } catch (erro) {
    dbConectado = false;
    console.error("❌ [ERRO] Falha na conexão com o MongoDB:", erro.message);
  }
}

conectarBancoDados();

// Rota simples de status
app.get('/api/status', (req, res) => {
  res.json({ conectado: dbConectado, timestamp: new Date() });
});

/**
 * ============================================================================
 * PACOTE 3: GERENCIAMENTO DE EVENTOS EM TEMPO REAL (SOCKET.IO)
 * ============================================================================
 */
io.on('connection', (socket) => {
  console.log(`🔌 Novo cliente conectado: ${socket.id}`);

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
      console.error("❌ [ERRO] Função novo_pedido:", erro);
    }
  });

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

  socket.on('fechar_comanda', async ({ localChave, registroVenda }) => {
    try {
      if (db && dbConectado) {
        if (registroVenda) await db.collection('vendas').insertOne(registroVenda);
        await db.collection('pedidos').deleteMany({
          $or: [
            { local: localChave },
            { mesa: localChave.replace('Mesa ', '') },
            { cliente: localChave.replace('AVULSO: ', '') }
          ]
        });

        const listaPedidos = await db.collection('pedidos').find({}).toArray();
        const listaVendas = await db.collection('vendas').find({}).toArray();

        io.emit('atualizar_lista_pedidos', listaPedidos);
        io.emit('atualizar_vendas', listaVendas);
      }
    } catch (erro) {
      console.error("❌ [ERRO] Função fechar_comanda:", erro);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

/**
 * ============================================================================
 * PACOTE 4: INICIALIZAÇÃO DO SERVIDOR HTTP NA PORTA CONFIGURADA
 * ============================================================================
 */
server.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});