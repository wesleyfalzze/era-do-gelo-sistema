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
 * PACOTE 2: GERENCIAMENTO, TESTE DE CONEXÃO E MIDDLEWARE DE BLOQUEIO
 * ============================================================================
 */
async function conectarBancoDados() {
  try {
    if (!MONGO_URI || MONGO_URI.includes('xxxxx')) {
      throw new Error("URL do MongoDB Atlas inválida ou não configurada nas variáveis de ambiente.");
    }
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
    dbConectado = true;
    console.log("🗄️ [SUCESSO] Conectado ao MongoDB Atlas com sucesso!");
  } catch (erro) {
    dbConectado = false;
    console.error("❌ [ERRO] Falha crítica na função conectarBancoDados:", erro.message);
  }
}

conectarBancoDados();

// Middleware de bloqueio global: o sistema só funciona se o banco estiver 100% conectado
app.use((req, res, next) => {
  try {
    if (req.path === '/api/status') {
      return next();
    }

    if (!dbConectado) {
      return res.status(503).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Era do Gelo - Sistema Indisponível</title>
          <style>
            body { background: #020617; color: #f8fafc; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #0f172a; border: 1px solid #1e293b; padding: 30px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5); }
            h1 { color: #f43f5e; font-size: 22px; margin-bottom: 10px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 20px; }
            .btn { background: #06b6d4; color: #020617; padding: 10px 20px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>⚠️ Sistema Fora do Air</h1>
            <p>O sistema não pode ser iniciado porque a conexão com o banco de dados falhou ou está instável.</p>
            <p>Por favor, entre em contato com o suporte técnico para regularizar o serviço.</p>
            <a href="https://wa.me/5500000000000" class="btn" target="_blank">Contatar Suporte 🛠️</a>
          </div>
        </body>
        </html>
      `);
    }
    next();
  } catch (erro) {
    console.error("❌ [ERRO] Middleware de verificação de conexão:", erro.message);
    res.status(500).send("Erro interno no servidor.");
  }
});

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
 * PACOTE 3: EVENTOS EM TEMPO REAL (SOCKET.IO) E INICIALIZAÇÃO DA PORTA
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
      console.error("❌ [ERRO] Função novo_pedido:", erro.message);
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

const PORT = process.env.PORT || 10000;

function iniciarServidor() {
  try {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 [SUCESSO] Servidor modular rodando na porta ${PORT}`);
    });
  } catch (erro) {
    console.error("❌ [ERRO] Falha crítica na função iniciarServidor:", erro.message);
    process.exit(1);
  }
}

iniciarServidor();