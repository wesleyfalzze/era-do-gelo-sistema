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
   * PACOTE 4: FUNÇÕES DE AUTENTICAÇÃO E SESSÃO
   * ============================================================================
   */
  function handleLogin(e) {
    try {
      e.preventDefault();
      setErroLogin('');

      const userEncontrado = listaUsuarios.find(
        (u) => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.senha === inputSenha
      );

      if (!userEncontrado) {
        setErroLogin('❌ Usuário ou senha incorretos!');
        return;
      }

      setUsuarioLogado(userEncontrado);
      setModalLoginAberto(false);
      setInputUsuario('');
      setInputSenha('');
      setAbaAtiva(userEncontrado.tipo === 'garcom' ? 'garcom' : 'salao');
    } catch (erro) {
      console.error("❌ [ERRO] Função handleLogin:", erro);
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
   * PACOTE 5: FUNÇÕES DE CLIENTES E AUTO-PREENCHIMENTO
   * ============================================================================
   */
  function handleCelularChange(e) {
    try {
      const tel = e.target.value;
      setCelularCliente(tel);
      const encontrado = clientesBanco.find(c => c.celular === tel);
      if (encontrado) {
        setNomeCliente(encontrado.nome);
      }
    } catch (erro) {
      console.error("❌ [ERRO] Função handleCelularChange:", erro);
    }
  }

  /**
   * ============================================================================
   * PACOTE 6: FUNÇÕES DE PEDIDOS, ITENS E MODAL DE OPÇÕES
   * ============================================================================
   */
  function abrirDetalhesItem(item) {
    try {
      setItemSelecionado(item);
      setQuantidadeModal(1);
      setPontoCarne('Ao ponto');
      setMolhosSelecionados([]);
    } catch (erro) {
      console.error("❌ [ERRO] Função abrirDetalhesItem:", erro);
    }
  }

  function alternarMolho(molho) {
    try {
      if (molho === 'Sem Molho') {
        setMolhosSelecionados(['Sem Molho']);
        return;
      }
      setMolhosSelecionados((prev) => {
        const filtrados = prev.filter((m) => m !== 'Sem Molho');
        return filtrados.includes(molho) ? filtrados.filter((m) => m !== molho) : [...filtrados, molho];
      });
    } catch (erro) {
      console.error("❌ [ERRO] Função alternarMolho:", erro);
    }
  }

  function confirmarAdicaoModal() {
    try {
      if (!itemSelecionado) return;
      const novoItemCarrinho = {
        ...itemSelecionado,
        quantidade: quantidadeModal,
        ponto: itemSelecionado.categoria === 'Espetinhos' ? pontoCarne : null,
        molhos: molhosSelecionados,
        precoTotalItem: itemSelecionado.preco * quantidadeModal
      };
      setCarrinho((prev) => [...prev, novoItemCarrinho]);
      setItemSelecionado(null);
    } catch (erro) {
      console.error("❌ [ERRO] Função confirmarAdicaoModal:", erro);
    }
  }

  function enviarPedido() {
    try {
      if (carrinho.length === 0) return;

      let identificadorFinal = '';
      let numeroMesaFinal = 'Avulso';
      let nomeClienteFinal = nomeCliente || 'Cliente';

      if (mesaAlvoGarcom) {
        const numFmt = String(mesaAlvoGarcom).padStart(2, '0');
        identificadorFinal = `Mesa ${numFmt}`;
        numeroMesaFinal = numFmt;
        nomeClienteFinal = `Mesa ${numFmt} (${usuarioLogado.nome})`;
      } else if (tipoAtendimento === 'mesa') {
        if (!numMesa) {
          setMensagem('⚠️ Informe o número da mesa!');
          setTimeout(() => setMensagem(''), 3000);
          return;
        }
        const numFmt = String(numMesa).padStart(2, '0');
        identificadorFinal = `Mesa ${numFmt}`;
        numeroMesaFinal = numFmt;
      } else {
        identificadorFinal = `AVULSO: ${identificacaoAvulsa || 'Balcão'}`;
        numeroMesaFinal = 'Avulso';
      }

      if (celularCliente && nomeCliente) {
        socket.emit('salvar_cliente', { celular: celularCliente, nome: nomeCliente });
      }

      const totalCalculado = carrinho.reduce((acc, item) => acc + item.precoTotalItem, 0);
      const origemAtendimento = usuarioLogado ? `${usuarioLogado.tipo}: ${usuarioLogado.nome}` : 'Cliente (Autoatendimento)';

      const pedidoObjeto = {
        id: Date.now(),
        local: identificadorFinal,
        tipo: mesaAlvoGarcom ? 'mesa' : tipoAtendimento,
        mesa: numeroMesaFinal,
        cliente: nomeClienteFinal,
        celular: celularCliente || 'Não informado',
        atendente: origemAtendimento,
        itens: carrinho,
        total: totalCalculado,
        status: 'Pendente',
        entregue: false,
        cancelado: false,
        horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setPedidoEnviadoSucesso(pedidoObjeto);
      socket.emit('novo_pedido', pedidoObjeto);
      setCarrinho([]);
      setMesaAlvoGarcom(null);
    } catch (erro) {
      console.error("❌ [ERRO] Função enviarPedido:", erro);
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
  return (
    <div className="min-h-screen bg-slate-950 text-white p-3 md:p-6 pb-24 font-sans flex flex-col justify-between">
      <div>
        <header className="max-w-4xl mx-auto bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-5 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-cyan-400 tracking-tight">Era do Gelo 🧊⚡</h1>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${bancoConectado ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                  {bancoConectado ? '🗄️ DB Online' : '⚠️ DB Offline'}
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {usuarioLogado ? `• ${usuarioLogado.tipo}: ${usuarioLogado.nome}` : '• AUTOATENDIMENTO CLIENTE'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap gap-1">
                <button onClick={() => setAbaAtiva('cardapio')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'cardapio' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
                  📋 Cardápio
                </button>

                {usuarioLogado && (
                  <>
                    <button onClick={() => setAbaAtiva('salao')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'salao' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
                      🪑 Salão
                    </button>
                    <button onClick={() => setAbaAtiva('garcom')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'garcom' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400'}`}>
                      🏃‍♂️ Garçom
                    </button>
                    <button onClick={() => setAbaAtiva('comandas')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'comandas' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>
                      💳 Comandas
                    </button>
                    <button onClick={() => setAbaAtiva('cozinha')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'cozinha' ? 'bg-rose-500 text-slate-950' : 'text-rose-400'}`}>
                      🔥 Cozinha
                    </button>
                    {(usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
                      <>
                        <button onClick={() => setAbaAtiva('relatorios')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'relatorios' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'}`}>📊 Relatórios</button>
                        <button onClick={() => setAbaAtiva('gerenciar_cardapio')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'gerenciar_cardapio' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400'}`}>⚙️ Cardápio</button>
                        <button onClick={() => setAbaAtiva('gerenciar_usuarios')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'gerenciar_usuarios' ? 'bg-indigo-500 text-slate-950' : 'text-indigo-400'}`}>👥 Usuários</button>
                      </>
                    )}
                  </>
                )}
              </div>

              {usuarioLogado ? (
                <button onClick={handleLogout} className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-all">Sair</button>
              ) : (
                <button onClick={() => setModalLoginAberto(true)} className="bg-slate-800 border border-slate-700 text-cyan-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all">🔐 Login Funcionário</button>
              )}
            </div>
          </div>
        </header>

        {mensagem && (
          <div className="max-w-4xl mx-auto mb-4 p-3 bg-cyan-500/20 border border-cyan-500 text-cyan-300 rounded-xl text-xs font-bold text-center">
            {mensagem}
          </div>
        )}

        {abaAtiva === 'cardapio' && (
          <main className="max-w-4xl mx-auto space-y-6">
            {!usuarioLogado && (
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
                <h2 className="text-sm font-bold text-cyan-400">🔍 Consultar Conta da Mesa</h2>
                <form onSubmit={consultarContaPorMesa} className="flex gap-2">
                  <input type="number" placeholder="Número da Mesa" value={mesaConsultaCliente} onChange={(e) => setMesaConsultaCliente(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                  <button type="submit" className="bg-cyan-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs">Consultar</button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <section className="md:col-span-2 space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categoriasUnicas.map((cat) => (
                    <button key={cat} onClick={() => setCategoriaSel(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${categoriaSel === cat ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}>
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {cardapioFiltrado.map((item) => (
                    <div key={item.id} onClick={() => abrirDetalhesItem(item)} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center cursor-pointer hover:border-cyan-500/40 transition-all">
                      <div>
                        <h3 className="font-bold text-sm">{item.nome} <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-400">{item.impressora}</span></h3>
                        <p className="text-xs text-slate-400">{item.descricao}</p>
                        <p className="text-cyan-400 font-extrabold text-sm mt-1">R$ {item.preco.toFixed(2)}</p>
                      </div>
                      <button className="bg-cyan-500/10 text-cyan-400 px-3 py-2 rounded-lg text-xs">+ Opções</button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-900 p-4 rounded-xl border border-slate-800 h-fit sticky top-4 space-y-4">
                <h2 className="text-base font-bold pb-2 border-b border-slate-800">Sua Sacola ({carrinho.length})</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {carrinho.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex justify-between">
                      <span>{item.quantidade}x {item.nome} {item.ponto ? `(${item.ponto})` : ''}</span>
                      <span className="text-cyan-400">R$ {item.precoTotalItem.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <input type="tel" placeholder="Celular (Preenche nome auto)" value={celularCliente} onChange={handleCelularChange} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs" />
                  <input type="text" placeholder="Seu Nome" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs" />
                  <button onClick={enviarPedido} disabled={carrinho.length === 0} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs">Enviar Pedido</button>
                </div>
              </section>
            </div>
          </main>
        )}

        {abaAtiva === 'salao' && usuarioLogado && (
          <main className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-base font-bold">Mapa do Salão</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {listaMesas.map((m) => (
                <div key={m.numero} className={`p-4 rounded-2xl border flex flex-col justify-between h-40 ${m.ocupada ? 'bg-rose-950/40 border-rose-500' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-3xl font-black">{m.numero}</span>
                  {m.ocupada && <span className="text-xs text-rose-400 font-bold">R$ {m.dados.totalComanda.toFixed(2)}</span>}
                  <button onClick={() => selecionarMesaParaLancar(m.numero)} className="bg-cyan-500/20 text-cyan-400 py-1 rounded text-xs font-bold">+ Lançar</button>
                </div>
              ))}
            </div>
          </main>
        )}

        {abaAtiva === 'garcom' && usuarioLogado && (
          <main className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-black text-emerald-400">🏃‍♂️ Painel do Garçom</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pedidos.filter(p => p.status === 'Pronto' && !p.entregue && !p.cancelado).map((p) => (
                <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-amber-500 space-y-3">
                  <span className="bg-emerald-500 text-slate-950 font-black px-2 py-1 rounded text-xs">{p.local}</span>
                  <button onClick={() => atualizarStatusPedido(p.id, 'Pronto')} className="w-full bg-emerald-500 text-slate-950 font-black py-2 rounded text-xs">Marcar como Entregue</button>
                </div>
              ))}
            </div>
          </main>
        )}

        {abaAtiva === 'comandas' && usuarioLogado && (
          <main className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-bold">Comandas Abertas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(comandasAgrupadas).map(([local, info]) => (
                <div key={local} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-black text-cyan-400">{local}</span> - <span className="text-xs">{info.cliente}</span>
                    <p className="text-emerald-400 font-bold mt-1">R$ {info.totalComanda.toFixed(2)}</p>
                  </div>
                  <button onClick={() => setMesaFechamento(info)} className="bg-emerald-500 text-slate-950 px-3 py-1 rounded text-xs font-black">Fechar Conta</button>
                </div>
              ))}
            </div>
          </main>
        )}

        {abaAtiva === 'relatorios' && usuarioLogado && (usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
          <main className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-amber-400">📊 Relatórios de Vendas</h2>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex gap-2">
              <input type="date" value={dataInicioFiltro} onChange={(e) => setDataInicioFiltro(e.target.value)} className="bg-slate-950 p-2 rounded text-xs" />
              <input type="date" value={dataFimFiltro} onChange={(e) => setDataFimFiltro(e.target.value)} className="bg-slate-950 p-2 rounded text-xs" />
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xl font-black text-emerald-400">
              Faturamento no Período: R$ {faturamentoPeriodo.toFixed(2)}
            </div>
          </main>
        )}

        {abaAtiva === 'gerenciar_cardapio' && usuarioLogado && (usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
          <main className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-emerald-400">⚙️ Adicionar Produto</h2>
              <form onSubmit={adicionarItemCardapio} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Nome" value={novoNomeItem} onChange={(e) => setNovoNomeItem(e.target.value)} className="bg-slate-950 p-2.5 rounded-xl text-xs" />
                <select value={novaCategoriaItem} onChange={(e) => setNovaCategoriaItem(e.target.value)} className="bg-slate-950 p-2.5 rounded-xl text-xs">
                  <option value="Espetinhos">Espetinhos</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Porções">Porções</option>
                </select>
                <input type="number" step="0.01" placeholder="Preço" value={novoPrecoItem} onChange={(e) => setNovoPrecoItem(e.target.value)} className="bg-slate-950 p-2.5 rounded-xl text-xs" />
                <select value={novaImpressoraItem} onChange={(e) => setNovaImpressoraItem(e.target.value)} className="bg-slate-950 p-2.5 rounded-xl text-xs font-bold text-cyan-400">
                  <option value="Cozinha 1">Cozinha 1 (Padrão)</option>
                  <option value="Cozinha 2">Cozinha 2</option>
                </select>
                <button type="submit" className="sm:col-span-2 bg-emerald-500 text-slate-950 font-black py-2.5 rounded-xl text-xs">Salvar Produto</button>
              </form>
            </div>
          </main>
        )}

        {/* MODAL DE OPÇÕES DO ITEM */}
        {itemSelecionado && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-4 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-cyan-400">{itemSelecionado.nome}</h3>
                <button onClick={() => setItemSelecionado(null)} className="text-slate-400 bg-slate-800 w-7 h-7 rounded-full text-xs font-bold">✕</button>
              </div>

              {itemSelecionado.categoria === 'Espetinhos' && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300">Ponto da Carne:</span>
                  {['Mal passado', 'Ao ponto', 'Bem passado'].map((p) => (
                    <label key={p} onClick={() => setPontoCarne(p)} className={`flex justify-between p-2 rounded-lg border text-xs cursor-pointer ${pontoCarne === p ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-400'}`}>
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">Escolha os Molhos:</span>
                {OPCOES_MOLHOS.map((molho) => {
                  const marcado = molhosSelecionados.includes(molho);
                  return (
                    <label key={molho} onClick={() => alternarMolho(molho)} className={`flex justify-between p-2 rounded-lg border text-xs cursor-pointer ${marcado ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-slate-800 text-slate-400'}`}>
                      <span>{molho}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                  <button onClick={() => setQuantidadeModal((q) => Math.max(1, q - 1))} className="w-8 h-8 font-bold">-</button>
                  <span className="w-8 text-center text-xs font-bold text-cyan-400">{quantidadeModal}</span>
                  <button onClick={() => setQuantidadeModal((q) => q + 1)} className="w-8 h-8 font-bold">+</button>
                </div>
                <button onClick={confirmarAdicaoModal} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl text-xs">
                  Adicionar • R$ {(itemSelecionado.preco * quantidadeModal).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalLoginAberto && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-5">
              <h3 className="font-bold text-base text-cyan-400">Login Funcionário</h3>
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="text" placeholder="Usuário" value={inputUsuario} onChange={(e) => setInputUsuario(e.target.value)} className="w-full bg-slate-950 p-2.5 rounded-xl text-xs" />
                <input type="password" placeholder="Senha" value={inputSenha} onChange={(e) => setInputSenha(e.target.value)} className="w-full bg-slate-950 p-2.5 rounded-xl text-xs" />
                {erroLogin && <p className="text-xs font-bold text-rose-400 text-center">{erroLogin}</p>}
                <button type="submit" className="w-full bg-cyan-500 text-slate-950 font-black py-3 rounded-xl text-xs">Entrar</button>
              </form>
            </div>
          </div>
        )}
      </div>

      <footer className="w-full text-center mt-10 pt-4 border-t border-slate-900/80">
        <span className="text-[10px] text-slate-600 font-mono tracking-wider">Era do Gelo Sistema • {VERSAO_SISTEMA}</span>
      </footer>
    </div>
  );
}