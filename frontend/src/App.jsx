/**
 * ============================================================================
 * PACOTE 1: IMPORTAÇÕES, CONSTANTES E CONFIGURAÇÃO SOCKET
 * ============================================================================
 */
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = "https://era-do-gelo-sistema.onrender.com"; 
const socket = io(BACKEND_URL);

const VERSAO_SISTEMA = "v3.4.0 • Modularizado por Pacotes";
const TOTAL_MESAS_SALAO = 15;

const OPCOES_MOLHOS = ['Molho Alho Caseiro', 'Molho Barbecue', 'Molho Verde / Cheiro Verde', 'Molho Picante / Pimenta', 'Sem Molho'];
const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito'];
const MOTIVOS_CANCELAMENTO = ['Não entregue', 'Recusado pelo cliente', 'Outros'];

const CARDAPIO_PADRAO_INICIAL = [
  { id: 1, nome: 'Espetinho de Boi (Alcatra)', categoria: 'Espetinhos', preco: 12.00, descricao: 'Carne macia', impressora: 'Cozinha 1' },
  { id: 2, nome: 'Espetinho de Frango com Bacon', categoria: 'Espetinhos', preco: 10.00, descricao: 'Frango com bacon', impressora: 'Cozinha 1' },
  { id: 3, nome: 'Cerveja Lata 350ml', categoria: 'Bebidas', preco: 6.00, descricao: 'Gelada', impressora: 'Cozinha 1' },
  { id: 4, nome: 'Porção de Fritas', categoria: 'Porções', preco: 30.00, descricao: 'Batata crocante', impressora: 'Cozinha 1' }
];

const USUARIOS_PADRAO_INICIAL = [
  { usuario: 'admin', senha: '@adm123', nome: 'Administrador Geral', tipo: 'adm' },
  { usuario: 'gestor1', senha: '123', nome: 'Carlos (Gestor)', tipo: 'gestor' },
  { usuario: 'garcom1', senha: '123', nome: 'João (Garçom)', tipo: 'garcom' }
];

export default function App() {
  /**
   * ============================================================================
   * PACOTE 2: ESTADOS DA APLICAÇÃO (STATE MANAGEMENT)
   * ============================================================================
   */
  const [bancoConectado, setBancoConectado] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState(null); 
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  
  const [inputUsuario, setInputUsuario] = useState('');
  const [inputSenha, setInputSenha] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  const [listaUsuarios, setListaUsuarios] = useState(USUARIOS_PADRAO_INICIAL);
  const [novoUsuario, setNovoUsuario] = useState('');
  const [novoSenhaUser, setNovoSenhaUser] = useState('');
  const [novoNomeUser, setNovoNomeUser] = useState('');
  const [novoTipoUser, setNovoTipoUser] = useState('garcom');

  const [abaAtiva, setAbaAtiva] = useState('cardapio');
  const [subAbaGarcom, setSubAbaGarcom] = useState('pendentes');
  const [categoriaSel, setCategoriaSel] = useState('Todas');
  const [cardapio, setCardapio] = useState(CARDAPIO_PADRAO_INICIAL);
  const [carrinho, setCarrinho] = useState([]);
  
  const [pedidos, setPedidos] = useState([]);
  const [historicoVendas, setHistoricoVendas] = useState([]);
  const [clientesBanco, setClientesBanco] = useState([]);
  const [novoPedidoAlerta, setNovoPedidoAlerta] = useState(null);

  const [configImpressoras, setConfigImpressoras] = useState({
    cozinha1: '\\\\SERVIDOR\\Cozinha1',
    cozinha2: '\\\\SERVIDOR\\Cozinha2'
  });

  const hojeStr = new Date().toISOString().split('T')[0];
  const [dataInicioFiltro, setDataInicioFiltro] = useState(hojeStr);
  const [dataFimFiltro, setDataFimFiltro] = useState(hojeStr);

  const [mesaConsultaCliente, setMesaConsultaCliente] = useState('');
  const [contaConsultada, setContaConsultada] = useState(null);
  const [contaSolicitadaSucesso, setContaSolicitadaSucesso] = useState(false);

  const [pedidoEnviadoSucesso, setPedidoEnviadoSucesso] = useState(null);
  const [mesaAlvoGarcom, setMesaAlvoGarcom] = useState(null);

  const [novoNomeItem, setNovoNomeItem] = useState('');
  const [novaCategoriaItem, setNovaCategoriaItem] = useState('Espetinhos');
  const [novoPrecoItem, setNovoPrecoItem] = useState('');
  const [novaDescItem, setNovaDescItem] = useState('');
  const [novaImpressoraItem, setNovaImpressoraItem] = useState('Cozinha 1');

  const [tipoAtendimento, setTipoAtendimento] = useState('mesa');
  const [numMesa, setNumMesa] = useState('');
  const [identificacaoAvulsa, setIdentificacaoAvulsa] = useState('');
  
  const [celularCliente, setCelularCliente] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [mensagem, setMensagem] = useState('');

  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [quantidadeModal, setQuantidadeModal] = useState(1);
  const [pontoCarne, setPontoCarne] = useState('Ao ponto');
  const [molhosSelecionados, setMolhosSelecionados] = useState([]);

  const [pedidoCancelamentoAlvo, setPedidoCancelamentoAlvo] = useState(null);
  const [motivoCancelamentoSel, setMotivoCancelamentoSel] = useState('Não entregue');

  const [mesaFechamento, setMesaFechamento] = useState(null);
  const [pagamentosMesa, setPagamentosMesa] = useState({});

  /**
   * ============================================================================
   * PACOTE 3: FUNÇÕES DE CONEXÃO E SINCRONIZAÇÃO EM TEMPO REAL
   * ============================================================================
   */
  useEffect(() => {
    function testarConexaoBackend() {
      fetch(`${BACKEND_URL}/api/status`)
        .then(res => res.json())
        .then(data => setBancoConectado(data.conectado))
        .catch(() => setBancoConectado(false));
    }

    testarConexaoBackend();

    socket.on('connect', () => {
      try {
        socket.emit('solicitar_pedidos');
      } catch (erro) {
        console.error("❌ [ERRO] Evento socket connect:", erro);
      }
    });

    socket.on('atualizar_lista_pedidos', (lista) => { if (lista) setPedidos(lista); });
    socket.on('atualizar_cardapio', (itens) => { if (itens && itens.length > 0) setCardapio(itens); });
    socket.on('atualizar_usuarios', (users) => { if (users && users.length > 0) setListaUsuarios(users); });
    socket.on('atualizar_vendas', (vendas) => { if (vendas) setHistoricoVendas(vendas); });
    socket.on('atualizar_clientes', (cli) => { if (cli) setClientesBanco(cli); });
    socket.on('atualizar_config_impressora', (cfg) => { if (cfg) setConfigImpressoras(cfg); });

    socket.on('pedido_recebido', (novoPedido) => {
      try {
        if (usuarioLogado) {
          setNovoPedidoAlerta(novoPedido);
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
          setTimeout(() => setNovoPedidoAlerta(null), 8000);
        }
      } catch (erro) {
        console.error("❌ [ERRO] Evento pedido_recebido:", erro);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('atualizar_lista_pedidos');
      socket.off('atualizar_cardapio');
      socket.off('atualizar_usuarios');
      socket.off('atualizar_vendas');
      socket.off('atualizar_clientes');
      socket.off('atualizar_config_impressora');
      socket.off('pedido_recebido');
    };
  }, [usuarioLogado]);

  /**
   * ============================================================================
   * PACOTE 4: FUNÇÕES DE AUTENTICAÇÃO E SESSÃO (PUXANDO DO BANCO)
   * ============================================================================
   */
  function handleLogin(e) {
    try {
      e.preventDefault();
      setErroLogin('');

      if (!inputUsuario) {
        setErroLogin('⚠️ Selecione um usuário da lista!');
        return;
      }

      const userEncontrado = listaUsuarios.find(
        (u) => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.senha === inputSenha
      );

      if (!userEncontrado) {
        setErroLogin('❌ Senha incorreta para este usuário!');
        return;
      }

      setUsuarioLogado(userEncontrado);
      setModalLoginAberto(false);
      setInputUsuario('');
      setInputSenha('');
      setAbaAtiva(userEncontrado.tipo === 'garcom' ? 'garcom' : 'salao');
    } catch (erro) {
      console.error("❌ [ERRO] Função handleLogin:", erro);
      setErroLogin('❌ Erro ao realizar login. Tente novamente.');
    }
  }

  function handleLogout() {
    try {
      setUsuarioLogado(null);
      setMesaAlvoGarcom(null);
      setAbaAtiva('cardapio');
    } catch (erro) {
      console.error("❌ [ERRO] Função handleLogout:", erro);
    }
  }   
  /**
  * ============================================================================
   * PACOTE 7: FUNÇÕES DE GESTÃO DE COZINHA E GARÇOM
   * ============================================================================
   */
  function atualizarStatusPedido(idPedido, novoStatus) {
    try {
      socket.emit('atualizar_status_pedido', { idPedido, status: novoStatus, entregue: false });
      setMensagem(`🔔 Pedido atualizado para: ${novoStatus}`);
      setTimeout(() => setMensagem(''), 3000);
    } catch (erro) {
      console.error("❌ [ERRO] Função atualizarStatusPedido:", erro);
    }
  }

  function confirmarCancelamentoPedido() {
    try {
      if (!pedidoCancelamentoAlvo) return;
      socket.emit('atualizar_status_pedido', {
        idPedido: pedidoCancelamentoAlvo.id,
        status: 'Cancelado',
        entregue: false,
        cancelado: true,
        motivoCancelamento: motivoCancelamentoSel
      });
      setMensagem(`⚠️ Pedido cancelado (${motivoCancelamentoSel})`);
      setPedidoCancelamentoAlvo(null);
      setTimeout(() => setMensagem(''), 3000);
    } catch (erro) {
      console.error("❌ [ERRO] Função confirmarCancelamentoPedido:", erro);
    }
  }

  /**
   * ============================================================================
   * PACOTE 8: FUNÇÕES DE CONFIGURAÇÃO (CARDÁPIO, USUÁRIOS E IMPRESSORAS)
   * ============================================================================
   */
  function cadastrarFuncionario(e) {
    try {
      e.preventDefault();
      if (!novoUsuario || !novoSenhaUser || !novoNomeUser) return;
      const novo = { usuario: novoUsuario.trim(), senha: novoSenhaUser, nome: novoNomeUser.trim(), tipo: novoTipoUser };
      const novaLista = [...listaUsuarios, novo];
      setListaUsuarios(novaLista);
      socket.emit('salvar_usuarios', novaLista);
      setNovoUsuario(''); setNovoSenhaUser(''); setNovoNomeUser('');
      setMensagem('✅ Colaborador cadastrado!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (erro) {
      console.error("❌ [ERRO] Função cadastrarFuncionario:", erro);
    }
  }

  function removerFuncionario(userLogin) {
    try {
      if (userLogin === 'admin') return;
      const novaLista = listaUsuarios.filter((u) => u.usuario !== userLogin);
      setListaUsuarios(novaLista);
      socket.emit('salvar_usuarios', novaLista);
    } catch (erro) {
      console.error("❌ [ERRO] Função removerFuncionario:", erro);
    }
  }

  function adicionarItemCardapio(e) {
    try {
      e.preventDefault();
      if (!novoNomeItem || !novoPrecoItem) return;
      const novo = {
        id: Date.now(),
        nome: novoNomeItem,
        categoria: novaCategoriaItem,
        preco: Number(novoPrecoItem),
        descricao: novaDescItem,
        impressora: novaImpressoraItem
      };
      const novoCardapio = [...cardapio, novo];
      setCardapio(novoCardapio);
      socket.emit('salvar_cardapio', novoCardapio);
      setNovoNomeItem(''); setNovoPrecoItem(''); setNovaDescItem('');
      setMensagem('✅ Item adicionado!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (erro) {
      console.error("❌ [ERRO] Função adicionarItemCardapio:", erro);
    }
  }

  function removerItemCardapio(id) {
    try {
      const novoCardapio = cardapio.filter((i) => i.id !== id);
      setCardapio(novoCardapio);
      socket.emit('salvar_cardapio', novoCardapio);
    } catch (erro) {
      console.error("❌ [ERRO] Função removerItemCardapio:", erro);
    }
  }

  function salvarConfigImpressoras(e) {
    try {
      e.preventDefault();
      socket.emit('salvar_config_impressora', configImpressoras);
      setMensagem('🖨️ Caminhos salvos!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (erro) {
      console.error("❌ [ERRO] Função salvarConfigImpressoras:", erro);
    }
  }

  /**
   * ============================================================================
   * PACOTE 9: FUNÇÕES DE COMANDAS E FECHAMENTO DE CAIXA
   * ============================================================================
   */
  function consultarContaPorMesa(e) {
    try {
      e.preventDefault();
      if (!mesaConsultaCliente) return;
      const numFmt = String(mesaConsultaCliente).padStart(2, '0');
      const chaveBuscada = `Mesa ${numFmt}`;
      const comandaEncontrada = comandasAgrupadas[chaveBuscada];

      if (!comandaEncontrada) {
        setContaConsultada({ status: 'nao_encontrada', local: chaveBuscada });
        return;
      }
      setContaConsultada({ status: 'encontrado', local: chaveBuscada, pedidos: comandaEncontrada.pedidos, total: comandaEncontrada.totalComanda });
    } catch (erro) {
      console.error("❌ [ERRO] Função consultarContaPorMesa:", erro);
    }
  }

  function solicitarFechamentoConta() {
    try {
      if (!mesaConsultaCliente) return;
      const numFmt = String(mesaConsultaCliente).padStart(2, '0');
      socket.emit('solicitar_fechamento', `Mesa ${numFmt}`);
      setContaSolicitadaSucesso(true);
      setTimeout(() => setContaSolicitadaSucesso(false), 5000);
    } catch (erro) {
      console.error("❌ [ERRO] Função solicitarFechamentoConta:", erro);
    }
  }

  function encerarComanda(localChave, infoComanda) {
    try {
      const totalPago = Object.values(pagamentosMesa).reduce((a, b) => a + Number(b || 0), 0);
      if (totalPago < infoComanda.totalComanda) {
        setMensagem(`⚠️ O valor pago é menor que o total!`);
        setTimeout(() => setMensagem(''), 3000);
        return;
      }

      const agora = new Date();
      const registroVenda = {
        id: Date.now(),
        dataIso: agora.toISOString().split('T')[0],
        local: localChave,
        cliente: infoComanda.cliente,
        total: infoComanda.totalComanda,
        pagamentos: pagamentosMesa,
        horarioFechamento: agora.toLocaleString('pt-BR'),
        responsavelFechamento: usuarioLogado?.nome || 'Gestor'
      };

      socket.emit('fechar_comanda', { localChave, registroVenda });
      setMesaFechamento(null);
      setPagamentosMesa({});
      setMensagem(`🏁 Comanda ${localChave} fechada com sucesso!`);
      setTimeout(() => setMensagem(''), 3000);
    } catch (erro) {
      console.error("❌ [ERRO] Função encerarComanda:", erro);
    }
  }

  function selecionarMesaParaLancar(numMesaStr) {
    try {
      setMesaAlvoGarcom(numMesaStr);
      setNumMesa(numMesaStr);
      setAbaAtiva('cardapio');
    } catch (erro) {
      console.error("❌ [ERRO] Função selecionarMesaParaLancar:", erro);
    }
  }

  // Cálculos Auxiliares
  const categoriasUnicas = ['Todas', ...new Set(cardapio.map((item) => item.categoria))];
  const cardapioFiltrado = categoriaSel === 'Todas' ? cardapio : cardapio.filter((i) => i.categoria === categoriaSel);
  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.precoTotalItem, 0);

  const comandasAgrupadas = pedidos.reduce((acc, pedido) => {
    if (pedido.cancelado) return acc;
    let chave = pedido.local;
    if (!chave && pedido.mesa && pedido.mesa !== 'Avulso') chave = `Mesa ${String(pedido.mesa).padStart(2, '0')}`;
    if (!chave) chave = 'Avulso';

    if (!acc[chave]) {
      acc[chave] = { local: chave, cliente: pedido.cliente, pedidos: [], totalComanda: 0, contaSolicitada: false };
    }
    acc[chave].pedidos.push(pedido);
    acc[chave].totalComanda += pedido.total;
    if (pedido.contaSolicitada) acc[chave].contaSolicitada = true;
    return acc;
  }, {});

  const listaMesas = Array.from({ length: TOTAL_MESAS_SALAO }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const chave = `Mesa ${num}`;
    const ocupada = Boolean(comandasAgrupadas[chave]);
    return { numero: num, chave, ocupada, dados: comandasAgrupadas[chave] || null };
  });

  const vendasFiltradasPorPeriodo = historicoVendas.filter((v) => {
    if (!v.dataIso) return true;
    return v.dataIso >= dataInicioFiltro && v.dataIso <= dataFimFiltro;
  });
  const faturamentoPeriodo = vendasFiltradasPorPeriodo.reduce((acc, v) => acc + v.total, 0);

  /**
   * ============================================================================
   * PACOTE 10: RENDERIZAÇÃO DA INTERFACE (JSX)
   * ============================================================================
   */
  {modalLoginAberto && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-bold text-base text-cyan-400">Login Funcionário (Banco de Dados)</h3>
                <button onClick={() => setModalLoginAberto(false)} className="text-slate-400 bg-slate-800 w-7 h-7 rounded-full text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Selecione o Usuário:</label>
                  <select 
                    value={inputUsuario} 
                    onChange={(e) => setInputUsuario(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  >
                    <option value="">-- Escolha um Colaborador Cadastrado --</option>
                    {listaUsuarios.map((u) => (
                      <option key={u.usuario} value={u.usuario}>
                        {u.nome} ({u.usuario}) — [{u.tipo.toUpperCase()}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Digite a Senha:</label>
                  <input 
                    type="password" 
                    placeholder="Digite sua senha" 
                    value={inputSenha} 
                    onChange={(e) => setInputSenha(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" 
                  />
                </div>

                {erroLogin && <p className="text-xs font-bold text-rose-400 text-center">{erroLogin}</p>}

                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg transition-all">
                  Entrar no Sistema
                </button>
              </form>
            </div>
          </div>
        )}