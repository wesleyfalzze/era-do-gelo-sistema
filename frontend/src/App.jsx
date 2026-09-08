/**
 * ============================================================================
 * PACOTE 1: IMPORTAÇÕES, ESTADOS E CONFIGURAÇÕES DO CLIENTE (FRONTEND)
 * ============================================================================
 */
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = "https://era-do-gelo-sistema.onrender.com"; 
const socket = io(BACKEND_URL);

const VERSAO_SISTEMA = "v3.5.0 • Completo & Modularizado";
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
   * PACOTE 2: GERENCIAMENTO DE ESTADOS (STATE MANAGEMENT)
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

  const [tipoAtendimento, setTipoAtendimento] = useState('avulso');
  const [numMesa, setNumMesa] = useState('');
  const [identificacaoAvulsa, setIdentificacaoAvulsa] = useState('Balcão');
  
  // Memória local para facilitar salvamento de celular e nome
  const [celularCliente, setCelularCliente] = useState(() => localStorage.getItem('eradogelo_cliente_celular') || '');
  const [nomeCliente, setNomeCliente] = useState(() => localStorage.getItem('eradogelo_cliente_nome') || '');
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
   * PACOTE 3: CONEXÃO, SOCKET E SINCRONIZAÇÃO EM TEMPO REAL
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
   * PACOTE 4: FUNÇÕES DE AUTENTICAÇÃO (LOGIN / LOGOUT)
   * ============================================================================
   */
  function handleLogin(e) {
    try {
      e.preventDefault();
      setErroLogin('');

      if (!inputUsuario) {
        setErroLogin('⚠️ Selecione um usuário!');
        return;
      }

      const userEncontrado = listaUsuarios.find(
        (u) => u.usuario.toLowerCase() === inputUsuario.trim().toLowerCase() && u.senha === inputSenha
      );

      if (!userEncontrado) {
        setErroLogin('❌ Senha incorreta!');
        return;
      }

      setUsuarioLogado(userEncontrado);
      setModalLoginAberto(false);
      setInputUsuario('');
      setInputSenha('');
      setAbaAtiva(userEncontrado.tipo === 'garcom' ? 'garcom' : 'salao');
    } catch (erro) {
      console.error("❌ [ERRO] Função handleLogin:", erro);
      setErroLogin('❌ Erro no login.');
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
   * PACOTE 5: FUNÇÕES DE CLIENTES E PREENCHIMENTO AUTOMÁTICO
   * ============================================================================
   */
  function handleCelularChange(e) {
    try {
      const tel = e.target.value;
      setCelularCliente(tel);
      localStorage.setItem('eradogelo_cliente_celular', tel);

      const encontrado = clientesBanco.find(c => c.celular === tel);
      if (encontrado) {
        setNomeCliente(encontrado.nome);
        localStorage.setItem('eradogelo_cliente_nome', encontrado.nome);
      }
    } catch (erro) {
      console.error("❌ [ERRO] Função handleCelularChange:", erro);
    }
  }

  function handleNomeChange(e) {
    try {
      const nome = e.target.value;
      setNomeCliente(nome);
      localStorage.setItem('eradogelo_cliente_nome', nome);
    } catch (erro) {
      console.error("❌ [ERRO] Função handleNomeChange:", erro);
    }
  }

  /**
   * ============================================================================
   * PACOTE 6: FUNÇÕES DE CARRINHO, OPÇÕES E PEDIDOS
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
      if (carrinho.length === 0) {
        setMensagem('⚠️ Sua sacola está vazia!');
        setTimeout(() => setMensagem(''), 3000);
        return;
      }

      let identificadorFinal = '';
      let numeroMesaFinal = 'Avulso';
      let nomeClienteFinal = nomeCliente ? nomeCliente.trim() : 'Cliente';

      if (mesaAlvoGarcom) {
        const numFmt = String(mesaAlvoGarcom).padStart(2, '0');
        identificadorFinal = `Mesa ${numFmt}`;
        numeroMesaFinal = numFmt;
        nomeClienteFinal = `Mesa ${numFmt} (${usuarioLogado.nome})`;
      } else {
        identificadorFinal = `AVULSO: ${identificacaoAvulsa || 'Balcão'}`;
        numeroMesaFinal = 'Avulso';
      }

      if (celularCliente && nomeCliente) {
        socket.emit('salvar_cliente', { celular: celularCliente, nome: nomeCliente.trim() });
      }

      const totalCalculado = carrinho.reduce((acc, item) => acc + item.precoTotalItem, 0);
      const origemAtendimento = usuarioLogado ? `${usuarioLogado.tipo}: ${usuarioLogado.nome}` : 'Cliente (Autoatendimento)';

      const pedidoObjeto = {
        id: Date.now(),
        local: identificadorFinal,
        tipo: mesaAlvoGarcom ? 'mesa' : 'avulso',
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
      setMensagem('❌ Erro ao enviar pedido.');
      setTimeout(() => setMensagem(''), 3000);
    }
  }

  /**
   * ============================================================================
   * PACOTE 7: GESTÃO DE COZINHA, ENTREGAS E CANCELAMENTOS
   * ============================================================================
   */
  function atualizarStatusPedido(idPedido, novoStatus) {
    try {
      socket.emit('atualizar_status_pedido', { idPedido, status: novoStatus, entregue: false });
      setMensagem(`🔔 Status atualizado para: ${novoStatus}`);
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
   * PACOTE 8: CONFIGURAÇÕES (CARDÁPIO, USUÁRIOS E IMPRESSORAS)
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
      setMensagem('✅ Produto salvo!');
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
   * PACOTE 9: COMANDAS E FECHAMENTO DE CAIXA
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
        setMensagem(`⚠️ Valor pago menor que o total!`);
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
      setMensagem(`🏁 Comanda ${localChave} fechada!`);
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

  // Cálculos e Agrupamentos Auxiliares
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
                  {usuarioLogado ? `• ${usuarioLogado.tipo}: ${usuarioLogado.nome}` : '• AUTOATENDIMENTO'}
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
                      🏃‍♂️ Garçom ({pedidos.filter(p => p.status === 'Pronto' && !p.entregue && !p.cancelado).length})
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
                <button onClick={() => setModalLoginAberto(true)} className="bg-slate-800 border border-slate-700 text-cyan-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all">🔐 Login</button>
              )}
            </div>
          </div>
        </header>

        {usuarioLogado && novoPedidoAlerta && (
          <div className="max-w-4xl mx-auto mb-4 p-4 bg-amber-500/20 border-2 border-amber-500 text-amber-300 rounded-2xl flex justify-between items-center animate-bounce shadow-2xl">
            <div>
              <span className="font-black text-sm block">🚨 NOVO PEDIDO CHEGOU! ({novoPedidoAlerta.local})</span>
              <span className="text-xs text-amber-200">Cliente: {novoPedidoAlerta.cliente}</span>
            </div>
            <button onClick={() => { setAbaAtiva('cozinha'); setNovoPedidoAlerta(null); }} className="bg-amber-500 text-slate-950 font-black px-3 py-2 rounded-xl text-xs shadow-lg">Ver na Cozinha 👀</button>
          </div>
        )}

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
                {contaConsultada && (
                  <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                    {contaConsultada.status === 'nao_encontrada' && <p className="text-rose-400 font-bold">Nenhuma comanda aberta para {contaConsultada.local}.</p>}
                    {contaConsultada.status === 'encontrado' && (
                      <>
                        <div className="flex justify-between font-bold text-cyan-400">
                          <span>{contaConsultada.local}</span>
                          <span className="text-emerald-400">Total: R$ {contaConsultada.total.toFixed(2)}</span>
                        </div>
                        <button onClick={solicitarFechamentoConta} className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded-lg mt-2">🛎️ Solicitar Fechamento de Conta</button>
                        {contaSolicitadaSucesso && <p className="text-emerald-400 font-bold text-center mt-1">✅ Solicitado!</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <section className="md:col-span-2 space-y-4">
                {mesaAlvoGarcom && (
                  <div className="bg-cyan-500/20 border border-cyan-500 p-3 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-bold text-cyan-300">🛎️ Lançando para a Mesa {mesaAlvoGarcom}</span>
                    <button onClick={() => setMesaAlvoGarcom(null)} className="text-rose-400 font-bold underline">Cancelar</button>
                  </div>
                )}

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
                  {carrinho.length === 0 ? (
                    <p className="text-slate-500 text-xs py-2 text-center">Nenhum item na sacola.</p>
                  ) : (
                    carrinho.map((item, idx) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex justify-between">
                        <span>{item.quantidade}x {item.nome} {item.ponto ? `(${item.ponto})` : ''}</span>
                        <span className="text-cyan-400">R$ {item.precoTotalItem.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 block font-medium">Celular / WhatsApp:</label>
                    <input 
                      type="tel" 
                      placeholder="(27) 99999-9999" 
                      value={celularCliente} 
                      onChange={handleCelularChange} 
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-white" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 block font-medium">Seu Nome:</label>
                    <input 
                      type="text" 
                      placeholder="Digite seu nome" 
                      value={nomeCliente} 
                      onChange={handleNomeChange} 
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-white" 
                    />
                  </div>

                  <div className="flex justify-between text-sm font-bold pt-2">
                    <span className="text-slate-400">Total:</span>
                    <span className="text-cyan-400 text-base">R$ {totalCarrinho.toFixed(2)}</span>
                  </div>

                  <button onClick={enviarPedido} disabled={carrinho.length === 0} className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-extrabold py-3 rounded-xl text-xs shadow-lg transition-all">
                    Fazer Pedido
                  </button>
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
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
              <button onClick={() => setSubAbaGarcom('pendentes')} className={`px-4 py-2 rounded-lg text-xs font-bold ${subAbaGarcom === 'pendentes' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>Pendentes ({pedidos.filter(p => p.status === 'Pronto' && !p.entregue && !p.cancelado).length})</button>
              <button onClick={() => setSubAbaGarcom('entregues')} className={`px-4 py-2 rounded-lg text-xs font-bold ${subAbaGarcom === 'entregues' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>Entregues ({pedidos.filter(p => p.entregue && !p.cancelado).length})</button>
            </div>

            {subAbaGarcom === 'pendentes' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pedidos.filter(p => p.status === 'Pronto' && !p.entregue && !p.cancelado).map((p) => (
                  <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-amber-500 space-y-3">
                    <span className="bg-emerald-500 text-slate-950 font-black px-2 py-1 rounded text-xs">{p.local}</span>
                    <button onClick={() => socket.emit('atualizar_status_pedido', { idPedido: p.id, status: 'Pronto', entregue: true, garcomEntrega: usuarioLogado.nome, horarioEntrega: new Date().toLocaleTimeString() })} className="w-full bg-emerald-500 text-slate-950 font-black py-2 rounded text-xs">Marcar como Entregue</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pedidos.filter(p => p.entregue && !p.cancelado).map((p) => (
                  <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-emerald-500/40 space-y-3">
                    <span className="bg-cyan-500 text-slate-950 font-black px-2 py-1 rounded text-xs">{p.local}</span>
                    <span className="text-xs text-emerald-300 block">Entregue por {p.garcomEntrega} às {p.horarioEntrega}</span>
                  </div>
                ))}
              </div>
            )}
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

        {abaAtiva === 'cozinha' && usuarioLogado && (
          <main className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-black text-rose-400">🔥 Cozinha (KDS)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pedidos.filter(p => !p.cancelado).map((p) => (
                <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="bg-rose-500 text-slate-950 font-black px-2 py-1 rounded text-xs">{p.local}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => atualizarStatusPedido(p.id, 'Preparando')} className="bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold py-2 rounded text-xs">Preparando</button>
                    <button onClick={() => atualizarStatusPedido(p.id, 'Pronto')} className="bg-emerald-500 text-slate-950 font-black py-2 rounded text-xs">Pronto!</button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {abaAtiva === 'gerenciar_cardapio' && usuarioLogado && (usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
          <main className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
              <h2 className="text-base font-bold text-cyan-400">🖨️ Configuração de Impressão Direta</h2>
              <form onSubmit={salvarConfigImpressoras} className="space-y-3">
                <input type="text" value={configImpressoras.cozinha1} onChange={(e) => setConfigImpressoras({...configImpressoras, cozinha1: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" />
                <button type="submit" className="bg-cyan-500 text-slate-950 font-black px-4 py-2 rounded text-xs">Salvar Impressoras</button>
              </form>
            </div>
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

        {abaAtiva === 'gerenciar_usuarios' && usuarioLogado && (usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
          <main className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-indigo-400">👥 Cadastrar Usuário</h2>
              <form onSubmit={cadastrarFuncionario} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Nome" value={novoNomeUser} onChange={(e) => setNovoNomeUser(e.target.value)} className="bg-slate-950 p-2.5 rounded-xl text-xs" />
                <input type="text" placeholder="Login" value={novoUsuario} onChange={(e) => setNovoUsuario(e.target.value)} className="bg-slate-950 p-2.5 rounded-xl text-xs" />
                <input type="password" placeholder="Senha" value={novoSenhaUser} onChange={(e) => setNovoSenhaUser(e.target.value)} className="bg-slate-950 p-2.5 rounded-xl text-xs" />
                <select value={novoTipoUser} onChange={(e) => setNovoTipoUser(e.target.value)} className="bg-slate-950 p-2.5 rounded-xl text-xs">
                  <option value="garcom">Garçom</option>
                  <option value="gestor">Gestor</option>
                  <option value="adm">Administrador</option>
                </select>
                <button type="submit" className="sm:col-span-2 bg-indigo-500 text-slate-950 font-black py-2.5 rounded-xl text-xs">Salvar Colaborador</button>
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
                <span className="text-xs font-bold text-slate-300">Molhos:</span>
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

        {/* MODAL DE LOGIN DISCRETO */}
        {modalLoginAberto && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 z-50">
            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl w-full max-w-xs space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-semibold text-xs text-slate-300 tracking-wider">ACESSO RESTRITO</h3>
                <button onClick={() => setModalLoginAberto(false)} className="text-slate-500 hover:text-slate-300 text-xs font-bold">✕</button>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <select value={inputUsuario} onChange={(e) => setInputUsuario(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500">
                  <option value="">Selecione o usuário...</option>
                  <option value="admin">Administrador Geral</option>
                  {listaUsuarios.filter(u => u.usuario !== 'admin').map((u) => (
                    <option key={u.usuario} value={u.usuario}>{u.nome} ({u.tipo})</option>
                  ))}
                </select>

                <input type="password" placeholder="Senha" value={inputSenha} onChange={(e) => setInputSenha(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500" />

                {erroLogin && <p className="text-[11px] font-medium text-rose-400 text-center">{erroLogin}</p>}

                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-lg text-xs transition-all border border-slate-700">
                  Entrar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DE FECHAMENTO DE COMANDA */}
        {mesaFechamento && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-bold text-base text-cyan-400">Fechar Conta ({mesaFechamento.local})</h3>
                <button onClick={() => setMesaFechamento(null)} className="text-slate-400 bg-slate-800 w-7 h-7 rounded-full text-xs font-bold">✕</button>
              </div>
              <p className="text-sm font-bold text-emerald-400">Total: R$ {mesaFechamento.totalComanda.toFixed(2)}</p>
              <div className="space-y-2">
                {FORMAS_PAGAMENTO.map((forma) => (
                  <div key={forma} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 text-xs">
                    <span>{forma}</span>
                    <input type="number" step="0.01" placeholder="R$ 0,00" value={pagamentosMesa[forma] || ''} onChange={(e) => setPagamentosMesa(prev => ({ ...prev, [forma]: e.target.value }))} className="w-24 bg-slate-900 p-1 rounded text-cyan-400 text-right" />
                  </div>
                ))}
              </div>
              <button onClick={() => encerarComanda(mesaFechamento.local, mesaFechamento)} className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-xl text-xs">
                Confirmar Fechamento
              </button>
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