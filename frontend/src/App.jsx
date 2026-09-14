import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = "https://era-do-gelo-sistema.onrender.com"; 
const socket = io(BACKEND_URL);

const VERSAO_SISTEMA = (() => {
  const agora = new Date();
  const dataFmt = agora.toLocaleDateString('pt-BR');
  const horaFmt = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `v3.7.1 • Compilado em ${dataFmt} às ${horaFmt}`;
})();

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

  const [modoAtendimentoSacola, setModoAtendimentoSacola] = useState('mesa');
  const [numeroMesaSacola, setNumeroMesaSacola] = useState('');

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

  function abrirModalItem(item) {
    setItemSelecionado(item);
    setQuantidadeModal(1);
    setPontoCarne('Ao ponto');
    setMolhosSelecionados([]);
  }

  function adicionarAoCarrinho() {
    if (!itemSelecionado) return;
    const precoUnitario = itemSelecionado.preco;
    const precoTotalItem = precoUnitario * quantidadeModal;

    const itemCarrinho = {
      ...itemSelecionado,
      quantidade: quantidadeModal,
      ponto: itemSelecionado.categoria === 'Espetinhos' ? pontoCarne : null,
      molhos: molhosSelecionados,
      precoTotalItem
    };

    setCarrinho([...carrinho, itemCarrinho]);
    setItemSelecionado(null);
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
      } else if (modoAtendimentoSacola === 'mesa') {
        if (!numeroMesaSacola) {
          setMensagem('⚠️ Informe o número da mesa para entrega!');
          setTimeout(() => setMensagem(''), 3000);
          return;
        }
        const numFmt = String(numeroMesaSacola).padStart(2, '0');
        identificadorFinal = `Mesa ${numFmt}`;
        numeroMesaFinal = numFmt;
      } else {
        if (!nomeCliente) {
          setMensagem('⚠️ Informe o seu nome para o pedido avulso!');
          setTimeout(() => setMensagem(''), 3000);
          return;
        }
        identificadorFinal = `AVULSO: ${nomeCliente}`;
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
        tipo: mesaAlvoGarcom || modoAtendimentoSacola === 'mesa' ? 'mesa' : 'avulso',
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
      setNumeroMesaSacola('');
    } catch (erro) {
      console.error("❌ [ERRO] Função enviarPedido:", erro);
      setMensagem('❌ Erro ao enviar pedido.');
      setTimeout(() => setMensagem(''), 3000);
    }
  }

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏔️</span>
            <div>
              <h1 className="text-base font-black tracking-wide text-white">ERA DO GELO</h1>
              <span className="text-[10px] text-cyan-400 font-semibold">Sistema de Gestão & Autoatendimento</span>
            </div>
            <div className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${bancoConectado ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
              {bancoConectado ? '● Online' : '○ Offline'}
            </div>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <button 
              onClick={() => { setAbaAtiva('cardapio'); setMesaAlvoGarcom(null); }} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'cardapio' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              📖 Cardápio
            </button>
            <button 
              onClick={() => setAbaAtiva('consultar')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'consultar' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              🔍 Consultar Conta
            </button>

            {usuarioLogado && (usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
              <>
                <button 
                  onClick={() => setAbaAtiva('salao')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'salao' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  🪑 Salão
                </button>
                <button 
                  onClick={() => setAbaAtiva('cozinha')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'cozinha' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  🍳 Cozinha
                </button>
                <button 
                  onClick={() => setAbaAtiva('caixa')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'caixa' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  💰 Caixa
                </button>
                <button 
                  onClick={() => setAbaAtiva('config')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'config' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  ⚙️ Painel ADM
                </button>
              </>
            )}

            {usuarioLogado && usuarioLogado.tipo === 'garcom' && (
              <button 
                onClick={() => setAbaAtiva('garcom')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'garcom' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                📋 Painel Garçom
              </button>
            )}

            {!usuarioLogado ? (
              <button 
                onClick={() => { setModalLoginAberto(true); setErroLogin(''); }} 
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 transition-all ml-2"
              >
                🔐 Entrar
              </button>
            ) : (
              <button 
                onClick={handleLogout} 
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950 text-rose-400 border border-rose-900 hover:bg-rose-900 transition-all ml-2"
              >
                Sair ({usuarioLogado.nome.split(' ')[0]})
              </button>
            )}
          </nav>
        </div>
      </header>

      {mensagem && (
        <div className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 text-center text-xs shadow-lg animate-pulse">
          {mensagem}
        </div>
      )}

      <main className="max-w-6xl mx-auto w-full p-4 flex-grow">
        {mesaAlvoGarcom && (
          <div className="bg-amber-950 border border-amber-800 p-3 rounded-xl mb-4 flex justify-between items-center text-xs">
            <span className="font-bold text-amber-300">⚠️ Lançando comanda direto para a <b>Mesa {mesaAlvoGarcom}</b></span>
            <button 
              onClick={() => setMesaAlvoGarcom(null)} 
              className="bg-amber-800 hover:bg-amber-700 text-white px-2.5 py-1 rounded font-bold"
            >
              Cancelar Alvo
            </button>
          </div>
        )}

        {abaAtiva === 'cardapio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categoriasUnicas.map((cat, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setCategoriaSel(cat)} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${categoriaSel === cat ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cardapioFiltrado.map((item) => (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm text-white">{item.nome}</h3>
                        <span className="text-cyan-400 font-extrabold text-sm">R$ {item.preco.toFixed(2)}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{item.descricao}</p>
                    </div>
                    <button 
                      onClick={() => abrirModalItem(item)} 
                      className="mt-3 w-full bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-bold py-2 rounded-lg text-xs transition-all"
                    >
                      + Adicionar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <section className="bg-slate-900 p-4 rounded-xl border border-slate-800 h-fit space-y-4">
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

              <div className="space-y-3 pt-2 border-t border-slate-800">
                {!mesaAlvoGarcom && (
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button 
                      type="button" 
                      onClick={() => setModoAtendimentoSacola('mesa')} 
                      className={`py-1.5 rounded text-[11px] font-bold transition-all ${modoAtendimentoSacola === 'mesa' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      🪑 Na Mesa
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setModoAtendimentoSacola('avulso')} 
                      className={`py-1.5 rounded text-[11px] font-bold transition-all ${modoAtendimentoSacola === 'avulso' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      🚶‍♂️ Avulso / Balcão
                    </button>
                  </div>
                )}

                {(!mesaAlvoGarcom && modoAtendimentoSacola === 'mesa') && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-cyan-400 block font-bold">Número da Mesa:</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 05" 
                      value={numeroMesaSacola} 
                      onChange={(e) => setNumeroMesaSacola(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-cyan-300 font-bold" 
                    />
                  </div>
                )}

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

                <button 
                  onClick={enviarPedido} 
                  disabled={carrinho.length === 0} 
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-extrabold py-3 rounded-xl text-xs shadow-lg transition-all"
                >
                  Fazer Pedido
                </button>
              </div>
            </section>
          </div>
        )}

        {abaAtiva === 'consultar' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-center">Consultar Conta da Mesa</h2>
            <form onSubmit={consultarContaPorMesa} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Número da Mesa:</label>
                <input 
                  type="number" 
                  placeholder="Ex: 5" 
                  value={mesaConsultaCliente} 
                  onChange={(e) => setMesaConsultaCliente(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-white font-bold" 
                />
              </div>
              <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs">
                Consultar Comanda
              </button>
            </form>

            {contaConsultada && contaConsultada.status === 'nao_encontrada' && (
              <p className="text-rose-400 text-center text-xs pt-2">Nenhum consumo aberto para a {contaConsultada.local}.</p>
            )}

            {contaConsultada && contaConsultada.status === 'encontrado' && (
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="flex justify-between font-bold border-b border-slate-800 pb-2 text-xs">
                  <span>{contaConsultada.local}</span>
                  <span className="text-cyan-400">Total: R$ {contaConsultada.total.toFixed(2)}</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto text-xs">
                  {contaConsultada.pedidos.map(p => (
                    <div key={p.id} className="flex justify-between py-1 border-b border-slate-900">
                      <span>{p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(', ')}</span>
                      <span className="text-cyan-300">R$ {p.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={solicitarFechamentoConta} 
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all"
                >
                  🛎️ Solicitar Fechamento ao Garçom
                </button>
                {contaSolicitadaSucesso && (
                  <p className="text-emerald-400 text-center text-[11px] font-bold">Solicitação enviada! O garçom já foi avisado.</p>
                )}
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'salao' && usuarioLogado && (
          <div className="space-y-4">
            <h2 className="text-base font-bold">Salão - Visitas & Mesas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {listaMesas.map((mesa) => (
                <div 
                  key={mesa.numero} 
                  className={`p-4 rounded-xl border flex flex-col justify-between h-28 transition-all ${mesa.ocupada ? 'bg-amber-950/40 border-amber-800' : 'bg-slate-900 border-slate-800'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm">Mesa {mesa.numero}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${mesa.ocupada ? 'bg-amber-500 animate-ping' : 'bg-slate-600'}`}></span>
                  </div>
                  <div>
                    {mesa.ocupada ? (
                      <span className="text-xs text-amber-300 font-bold block">R$ {mesa.dados.totalComanda.toFixed(2)}</span>
                    ) : (
                      <span className="text-xs text-slate-500 block">Livre</span>
                    )}
                  </div>
                  <button 
                    onClick={() => selecionarMesaParaLancar(mesa.numero)} 
                    className="w-full bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-bold py-1.5 rounded text-[11px] transition-all"
                  >
                    + Lançar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'cozinha' && usuarioLogado && (
          <div className="space-y-4">
            <h2 className="text-base font-bold">Painel de Cozinha</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pedidos.filter(p => !p.cancelado && p.status !== 'Entregue').length === 0 ? (
                <p className="text-slate-500 text-xs py-8 text-center col-span-full">Nenhum pedido pendente na cozinha.</p>
              ) : (
                pedidos.filter(p => !p.cancelado && p.status !== 'Entregue').map(pedido => (
                  <div key={pedido.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-extrabold text-sm text-cyan-400">{pedido.local}</span>
                      <span className="text-xs bg-slate-800 px-2.5 py-1 rounded text-slate-300">{pedido.horario}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {pedido.itens.map((i, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{i.quantidade}x {i.nome} {i.ponto ? `(${i.ponto})` : ''}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-800">
                      <button 
                        onClick={() => atualizarStatusPedido(pedido.id, 'Em Preparo')} 
                        className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-1.5 rounded text-xs"
                      >
                        Em Preparo
                      </button>
                      <button 
                        onClick={() => atualizarStatusPedido(pedido.id, 'Pronto')} 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-1.5 rounded text-xs"
                      >
                        Pronto
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'caixa' && usuarioLogado && (
          <div className="space-y-6">
            <h2 className="text-base font-bold">Gestão de Caixa & Comandas</h2>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-cyan-400">Comandas em Aberto</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(comandasAgrupadas).length === 0 ? (
                  <p className="text-slate-500 text-xs">Nenhuma comanda aberta no momento.</p>
                ) : (
                  Object.entries(comandasAgrupadas).map(([chave, comanda]) => (
                    <div key={chave} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex justify-between font-bold text-xs">
                        <span>{chave}</span>
                        <span className="text-cyan-400">R$ {comanda.totalComanda.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{comanda.cliente}</p>
                      {comanda.contaSolicitada && (
                        <span className="inline-block bg-amber-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold">⚠️ Pediu Fechamento</span>
                      )}
                      <button 
                        onClick={() => setMesaFechamento(comanda)} 
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-1.5 rounded text-xs"
                      >
                        Encerrar Conta
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-cyan-400">Relatório de Vendas por Período</h3>
              <div className="flex gap-3 flex-wrap items-center">
                <input 
                  type="date" 
                  value={dataInicioFiltro} 
                  onChange={(e) => setDataInicioFiltro(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                />
                <span className="text-slate-400 text-xs">até</span>
                <input 
                  type="date" 
                  value={dataFimFiltro} 
                  onChange={(e) => setDataFimFiltro(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                />
                <span className="text-sm font-extrabold text-emerald-400 ml-auto">Faturamento: R$ {faturamentoPeriodo.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'garcom' && usuarioLogado && (
          <div className="space-y-4">
            <h2 className="text-base font-bold">Painel do Garçom</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pedidos.filter(p => !p.cancelado).map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-cyan-400 block">{p.local}</span>
                    <span className="text-slate-400">{p.itens.map(i => `${i.quantidade}x ${i.nome}`).join(', ')}</span>
                  </div>
                  <span className={`px-2 py-1 rounded font-bold text-[10px] ${p.status === 'Pronto' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'config' && usuarioLogado && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-cyan-400">Cadastrar Colaborador</h3>
              <form onSubmit={cadastrarFuncionario} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  value={novoNomeUser} 
                  onChange={(e) => setNovoNomeUser(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                />
                <input 
                  type="text" 
                  placeholder="Usuário de Login" 
                  value={novoUsuario} 
                  onChange={(e) => setNovoUsuario(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  value={novoSenhaUser} 
                  onChange={(e) => setNovoSenhaUser(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                />
                <select 
                  value={novoTipoUser} 
                  onChange={(e) => setNovoTipoUser(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
                >
                  <option value="garcom">Garçom</option>
                  <option value="gestor">Gestor</option>
                  <option value="adm">Administrador</option>
                </select>
                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded text-xs">
                  Cadastrar Colaborador
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-cyan-400">Adicionar Produto ao Cardápio</h3>
              <form onSubmit={adicionarItemCardapio} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Nome do Produto" 
                  value={novoNomeItem} 
                  onChange={(e) => setNovoNomeItem(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                />
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Preço (R$)" 
                  value={novoPrecoItem} 
                  onChange={(e) => setNovoPrecoItem(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                />
                <input 
                  type="text" 
                  placeholder="Descrição Curta" 
                  value={novaDescItem} 
                  onChange={(e) => setNovaDescItem(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                />
                <select 
                  value={novaCategoriaItem} 
                  onChange={(e) => setNovaCategoriaItem(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
                >
                  <option value="Espetinhos">Espetinhos</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Porções">Porções</option>
                </select>
                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded text-xs">
                  Salvar Produto
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {itemSelecionado && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-bold text-sm">{itemSelecionado.nome}</h3>
            
            {itemSelecionado.categoria === 'Espetinhos' && (
              <div className="space-y-1">
                <label className="text-xs text-slate-400 block">Ponto da Carne:</label>
                <select 
                  value={pontoCarne} 
                  onChange={(e) => setPontoCarne(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
                >
                  <option value="Mal passado">Mal passado</option>
                  <option value="Ao ponto">Ao ponto</option>
                  <option value="Bem passado">Bem passado</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-400 block">Quantidade:</label>
              <input 
                type="number" 
                min="1" 
                value={quantidadeModal} 
                onChange={(e) => setQuantidadeModal(Number(e.target.value))} 
                className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setItemSelecionado(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded text-xs font-bold">
                Cancelar
              </button>
              <button onClick={adicionarAoCarrinho} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 rounded text-xs font-extrabold">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalLoginAberto && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-bold text-sm text-center">Acesso Restrito</h3>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Usuário:</label>
                <select 
                  value={inputUsuario} 
                  onChange={(e) => setInputUsuario(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white"
                >
                  <option value="">Selecione o usuário...</option>
                  {listaUsuarios.map(u => (
                    <option key={u.usuario} value={u.usuario}>{u.nome} ({u.tipo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Senha:</label>
                <input 
                  type="password" 
                  value={inputSenha} 
                  onChange={(e) => setInputSenha(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white" 
                  placeholder="Sua senha" 
                />
              </div>
              {erroLogin && <p className="text-rose-400 text-xs font-bold text-center">{erroLogin}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalLoginAberto(false)} className="flex-1 bg-slate-800 py-2 rounded text-xs font-bold">
                  Voltar
                </button>
                <button type="submit" className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 rounded text-xs font-extrabold">
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mesaFechamento && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-sm">Fechamento de Comanda: {mesaFechamento.local}</h3>
            <p className="text-xs text-slate-400">Total a Pagar: <b className="text-cyan-400 text-sm">R$ {mesaFechamento.totalComanda.toFixed(2)}</b></p>
            
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block">Formas de Pagamento:</label>
              {FORMAS_PAGAMENTO.map(forma => (
                <div key={forma} className="flex justify-between items-center bg-slate-950 p-2 rounded text-xs">
                  <span>{forma}</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={pagamentosMesa[forma] || ''} 
                    onChange={(e) => setPagamentosMesa({...pagamentosMesa, [forma]: e.target.value})} 
                    className="w-24 bg-slate-900 border border-slate-800 p-1.5 rounded text-white text-right" 
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setMesaFechamento(null)} className="flex-1 bg-slate-800 py-2 rounded text-xs font-bold">
                Cancelar
              </button>
              <button onClick={() => encerarComanda(mesaFechamento.local, mesaFechamento)} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2 rounded text-xs font-extrabold">
                Concluir Fechamento
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full py-2 px-4 border-t border-slate-900 bg-slate-950/60 text-center">
        <span className="text-[10px] text-slate-500 tracking-wider">
          Era do Gelo • {VERSAO_SISTEMA}
        </span>
      </footer>
    </div>
  );
}