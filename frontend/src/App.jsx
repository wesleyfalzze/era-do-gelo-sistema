import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = "https://era-do-gelo-sistema.onrender.com"; 
const socket = io(BACKEND_URL);

const VERSAO_SISTEMA = "v3.0.0 • Atualizado em 02/09/2026 21:30";
const TOTAL_MESAS_SALAO = 15;

const OPCOES_MOLHOS = [
  'Molho Alho Caseiro',
  'Molho Barbecue',
  'Molho Verde / Cheiro Verde',
  'Molho Picante / Pimenta',
  'Sem Molho'
];

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito'
];

const CARDAPIO_PADRAO = [
  { id: 1, nome: 'Espetinho de Boi (Alcatra)', categoria: 'Espetinhos', preco: 12.00, descricao: 'Carne macia temperada na brasa' },
  { id: 2, nome: 'Espetinho de Frango com Bacon', categoria: 'Espetinhos', preco: 10.00, descricao: 'Frango suculento enrolado com bacon' },
  { id: 3, nome: 'Espetinho de Coração', categoria: 'Espetinhos', preco: 11.00, descricao: 'Coraçãozinho temperado no capricho' },
  { id: 4, nome: 'Espetinho de Queijo Coalho', categoria: 'Espetinhos', preco: 12.00, descricao: 'Queijo coalho tostado na brasa' },
  { id: 5, nome: 'Cerveja Lata 350ml', categoria: 'Bebidas', preco: 6.00, descricao: 'Gelada' },
  { id: 6, nome: 'Refrigerante Lata 350ml', categoria: 'Bebidas', preco: 5.00, descricao: 'Coca-Cola, Guaraná, Sprite' },
  { id: 7, nome: 'Água Mineral', categoria: 'Bebidas', preco: 4.00, descricao: 'Garrafa 500ml' },
  { id: 8, nome: 'Porção de Fritas', categoria: 'Porções', preco: 30.00, descricao: 'Acompanha molho da casa' },
  { id: 9, nome: 'Porção de Mandioca Frita', categoria: 'Porções', preco: 28.00, descricao: 'Bem crocante' }
];

const USUARIOS_PADRAO = [
  { usuario: 'admin', senha: '@adm123', nome: 'Administrador Geral', tipo: 'adm' },
  { usuario: 'gestor1', senha: '123', nome: 'Carlos (Gestor)', tipo: 'gestor' },
  { usuario: 'garcom1', senha: '123', nome: 'João (Garçom)', tipo: 'garcom' }
];

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null); 
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  
  const [inputUsuario, setInputUsuario] = useState('');
  const [inputSenha, setInputSenha] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  const [listaUsuarios, setListaUsuarios] = useState(USUARIOS_PADRAO);
  const [novoUsuario, setNovoUsuario] = useState('');
  const [novoSenhaUser, setNovoSenhaUser] = useState('');
  const [novoNomeUser, setNovoNomeUser] = useState('');
  const [novoTipoUser, setNovoTipoUser] = useState('garcom');

  const [abaAtiva, setAbaAtiva] = useState('cardapio');
  const [categoriaSel, setCategoriaSel] = useState('Todas');
  const [cardapio, setCardapio] = useState(CARDAPIO_PADRAO);
  const [carrinho, setCarrinho] = useState([]);
  
  const [pedidos, setPedidos] = useState([]);
  const [historicoVendas, setHistoricoVendas] = useState([]);
  const [novoPedidoAlerta, setNovoPedidoAlerta] = useState(null);

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

  const [tipoAtendimento, setTipoAtendimento] = useState('mesa');
  const [numMesa, setNumMesa] = useState('');
  const [identificacaoAvulsa, setIdentificacaoAvulsa] = useState('');
  
  // Captura automática de celular (ou salvamento em cache do navegador) + input manual se necessário
  const [celularCliente, setCelularCliente] = useState(() => {
    return localStorage.getItem('eradogelo_cliente_celular') || '';
  });
  const [nomeCliente, setNomeCliente] = useState(() => {
    return localStorage.getItem('eradogelo_cliente_nome') || '';
  });
  const [mensagem, setMensagem] = useState('');

  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [quantidadeModal, setQuantidadeModal] = useState(1);
  const [pontoCarne, setPontoCarne] = useState('Ao ponto');
  const [molhosSelecionados, setMolhosSelecionados] = useState([]);

  const [mesaFechamento, setMesaFechamento] = useState(null);
  const [pagamentosMesa, setPagamentosMesa] = useState({});

  useEffect(() => {
    socket.on('connect', () => {
      socket.emit('solicitar_pedidos');
    });

    socket.on('atualizar_lista_pedidos', (listaServidor) => {
      if (listaServidor) setPedidos(listaServidor);
    });

    socket.on('atualizar_cardapio', (cardapioServidor) => {
      if (cardapioServidor && cardapioServidor.length > 0) {
        setCardapio(cardapioServidor);
      }
    });

    socket.on('atualizar_usuarios', (usuariosServidor) => {
      if (usuariosServidor && usuariosServidor.length > 0) {
        setListaUsuarios(usuariosServidor);
      }
    });

    socket.on('atualizar_vendas', (vendasServidor) => {
      if (vendasServidor) setHistoricoVendas(vendasServidor);
    });

    socket.on('pedido_recebido', (novoPedido) => {
      setNovoPedidoAlerta(novoPedido);
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch (e) {}

      setTimeout(() => setNovoPedidoAlerta(null), 8000);
    });

    return () => {
      socket.off('connect');
      socket.off('atualizar_lista_pedidos');
      socket.off('atualizar_cardapio');
      socket.off('atualizar_usuarios');
      socket.off('atualizar_vendas');
      socket.off('pedido_recebido');
    };
  }, []);

  const handleLogin = (e) => {
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
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    setMesaAlvoGarcom(null);
    setAbaAtiva('cardapio');
  };

  const atualizarStatusPedido = (idPedido, novoStatus) => {
    socket.emit('atualizar_status_pedido', { idPedido, status: novoStatus });
    setMensagem(`🔔 Pedido atualizado para: ${novoStatus}`);
    setTimeout(() => setMensagem(''), 3000);
  };

  const cadastrarFuncionario = (e) => {
    e.preventDefault();
    if (!novoUsuario || !novoSenhaUser || !novoNomeUser) {
      setMensagem('⚠️ Preencha todos os campos!');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }

    const novo = {
      usuario: novoUsuario.trim(),
      senha: novoSenhaUser,
      nome: novoNomeUser.trim(),
      tipo: novoTipoUser
    };

    const novaLista = [...listaUsuarios, novo];
    setListaUsuarios(novaLista);
    socket.emit('salvar_usuarios', novaLista);

    setNovoUsuario('');
    setNovoSenhaUser('');
    setNovoNomeUser('');
    setMensagem('✅ Novo colaborador cadastrado!');
    setTimeout(() => setMensagem(''), 3000);
  };

  const removerFuncionario = (userLogin) => {
    if (userLogin === 'admin') {
      setMensagem('⚠️ Não é possível remover o administrador principal!');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }
    const novaLista = listaUsuarios.filter((u) => u.usuario !== userLogin);
    setListaUsuarios(novaLista);
    socket.emit('salvar_usuarios', novaLista);
    setMensagem('🗑️ Colaborador removido.');
    setTimeout(() => setMensagem(''), 3000);
  };

  const adicionarItemCardapio = (e) => {
    e.preventDefault();
    if (!novoNomeItem || !novoPrecoItem) {
      setMensagem('⚠️ Preencha nome e preço!');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }

    const novo = {
      id: Date.now(),
      nome: novoNomeItem,
      categoria: novaCategoriaItem,
      preco: Number(novoPrecoItem),
      descricao: novaDescItem
    };

    const novoCardapio = [...cardapio, novo];
    setCardapio(novoCardapio);
    socket.emit('salvar_cardapio', novoCardapio);

    setNovoNomeItem('');
    setNovoPrecoItem('');
    setNovaDescItem('');
    setMensagem('✅ Item adicionado ao cardápio!');
    setTimeout(() => setMensagem(''), 3000);
  };

  const removerItemCardapio = (id) => {
    const novoCardapio = cardapio.filter((i) => i.id !== id);
    setCardapio(novoCardapio);
    socket.emit('salvar_cardapio', novoCardapio);
    setMensagem('🗑️ Item removido.');
    setTimeout(() => setMensagem(''), 3000);
  };

  const categoriasUnicas = ['Todas', ...new Set(cardapio.map((item) => item.categoria))];

  const abrirDetalhesItem = (item) => {
    setItemSelecionado(item);
    setQuantidadeModal(1);
    setPontoCarne('Ao ponto');
    setMolhosSelecionados([]);
  };

  const confirmarAdicaoModal = () => {
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
  };

  const enviarPedido = () => {
    if (carrinho.length === 0) return;

    let identificadorFinal = '';
    let numeroMesaFinal = 'Avulso';
    let nomeClienteFinal = nomeCliente || 'Cliente Autoatendimento';

    if (mesaAlvoGarcom) {
      const numFmt = String(mesaAlvoGarcom).padStart(2, '0');
      identificadorFinal = `Mesa ${numFmt}`;
      numeroMesaFinal = numFmt;
      nomeClienteFinal = `Mesa ${numFmt} (${usuarioLogado.nome})`;
    } else if (tipoAtendimento === 'mesa') {
      if (!numMesa || numMesa.trim() === '') {
        setMensagem('⚠️ Informe o NÚMERO DA MESA!');
        setTimeout(() => setMensagem(''), 4000);
        return;
      }
      const numFmt = String(numMesa).padStart(2, '0');
      identificadorFinal = `Mesa ${numFmt}`;
      numeroMesaFinal = numFmt;
    } else {
      if (!identificacaoAvulsa || identificacaoAvulsa.trim() === '') {
        setMensagem('⚠️ Informe a identificação!');
        setTimeout(() => setMensagem(''), 4000);
        return;
      }
      identificadorFinal = `AVULSO: ${identificacaoAvulsa}`;
      numeroMesaFinal = 'Avulso';
    }

    // Salva o celular e nome no localStorage para capturar automaticamente nas próximas vezes
    if (celularCliente) {
      localStorage.setItem('eradogelo_cliente_celular', celularCliente);
    }
    if (nomeCliente) {
      localStorage.setItem('eradogelo_cliente_nome', nomeCliente);
    }

    const totalCalculado = carrinho.reduce((acc, item) => acc + item.precoTotalItem, 0);

    const pedidoObjeto = {
      id: Date.now(),
      local: identificadorFinal,
      tipo: mesaAlvoGarcom ? 'mesa' : tipoAtendimento,
      mesa: numeroMesaFinal,
      cliente: nomeClienteFinal,
      celular: celularCliente || 'Não informado',
      atendente: usuarioLogado ? `${usuarioLogado.nome} (${usuarioLogado.tipo})` : 'Cliente (Autoatendimento)',
      itens: carrinho,
      total: totalCalculado,
      status: 'Pendente',
      entregue: false, // Controle de entrega do garçom
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setPedidoEnviadoSucesso(pedidoObjeto);
    socket.emit('novo_pedido', pedidoObjeto);

    setCarrinho([]);
    setMesaAlvoGarcom(null);
  };

  const comandasAgrupadas = pedidos.reduce((acc, pedido) => {
    let chave = pedido.local;
    if (!chave && pedido.mesa && pedido.mesa !== 'Avulso') {
      chave = `Mesa ${String(pedido.mesa).padStart(2, '0')}`;
    } else if (!chave) {
      chave = 'Avulso';
    }

    if (!acc[chave]) {
      acc[chave] = {
        local: chave,
        cliente: pedido.cliente,
        pedidos: [],
        totalComanda: 0,
        contaSolicitada: false
      };
    }
    acc[chave].pedidos.push(pedido);
    acc[chave].totalComanda += pedido.total;
    if (pedido.contaSolicitada) acc[chave].contaSolicitada = true;
    return acc;
  }, {});

  const consultarContaPorMesa = (e) => {
    e.preventDefault();
    if (!mesaConsultaCliente) {
      setMensagem('⚠️ Informe o número da mesa!');
      setTimeout(() => setMensagem(''), 4000);
      return;
    }
    const numFmt = String(mesaConsultaCliente).padStart(2, '0');
    const chaveBuscada = `Mesa ${numFmt}`;
    const comandaEncontrada = comandasAgrupadas[chaveBuscada];

    if (!comandaEncontrada) {
      setContaConsultada({ status: 'nao_encontrada', local: chaveBuscada });
      return;
    }

    setContaConsultada({
      status: 'encontrado',
      local: chaveBuscada,
      pedidos: comandaEncontrada.pedidos,
      total: comandaEncontrada.totalComanda
    });
  };

  const solicitarFechamentoConta = () => {
    if (!mesaConsultaCliente) return;
    const numFmt = String(mesaConsultaCliente).padStart(2, '0');
    const chaveBuscada = `Mesa ${numFmt}`;
    socket.emit('solicitar_fechamento', chaveBuscada);
    setContaSolicitadaSucesso(true);
    setTimeout(() => setContaSolicitadaSucesso(false), 5000);
  };

  const encerarComanda = (localChave, infoComanda) => {
    const totalPago = Object.values(pagamentosMesa).reduce((a, b) => a + Number(b || 0), 0);
    if (totalPago < infoComanda.totalComanda) {
      setMensagem(`⚠️ O valor pago (R$ ${totalPago.toFixed(2)}) é menor que o total (R$ ${infoComanda.totalComanda.toFixed(2)})!`);
      setTimeout(() => setMensagem(''), 4000);
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
    setMensagem(`🏁 Comanda ${localChave} fechada e gravada com sucesso!`);
    setTimeout(() => setMensagem(''), 4000);
  };

  const selecionarMesaParaLancar = (numMesaStr) => {
    setMesaAlvoGarcom(numMesaStr);
    setNumMesa(numMesaStr);
    setAbaAtiva('cardapio');
  };

  const vendasFiltradasPorPeriodo = historicoVendas.filter((v) => {
    if (!v.dataIso) return true;
    return v.dataIso >= dataInicioFiltro && v.dataIso <= dataFimFiltro;
  });

  const faturamentoPeriodo = vendasFiltradasPorPeriodo.reduce((acc, v) => acc + v.total, 0);

  const definirOntem = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const ontemStr = d.toISOString().split('T')[0];
    setDataInicioFiltro(ontemStr);
    setDataFimFiltro(ontemStr);
  };

  const definirHoje = () => {
    setDataInicioFiltro(hojeStr);
    setDataFimFiltro(hojeStr);
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.precoTotalItem, 0);
  const cardapioFiltrado = categoriaSel === 'Todas' ? cardapio : cardapio.filter((i) => i.categoria === categoriaSel);

  const listaMesas = Array.from({ length: TOTAL_MESAS_SALAO }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const chave = `Mesa ${num}`;
    const ocupada = Boolean(comandasAgrupadas[chave]);
    return { numero: num, chave, ocupada, dados: comandasAgrupadas[chave] || null };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-3 md:p-6 pb-24 font-sans flex flex-col justify-between">
      <div>
        <header className="max-w-4xl mx-auto bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-5 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-cyan-400 tracking-tight">Era do Gelo 🧊⚡</h1>
                <span className="bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {usuarioLogado ? `• ${usuarioLogado.tipo}: ${usuarioLogado.nome}` : '• AUTOATENDIMENTO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {usuarioLogado ? 'Painel Operacional com Banco de Dados Nuvem' : 'Faça seu pedido direto pelo celular ou mesa'}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap gap-1">
                <button
                  onClick={() => setAbaAtiva('cardapio')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'cardapio' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                >
                  📋 Cardápio & Conta
                </button>

                {usuarioLogado && (
                  <>
                    <button
                      onClick={() => setAbaAtiva('salao')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'salao' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      🪑 Salão
                    </button>
                    <button
                      onClick={() => setAbaAtiva('garcom')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'garcom' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400'}`}
                    >
                      🏃‍♂️ Painel Garçom ({pedidos.filter(p => p.status === 'Pronto' && !p.entregue).length})
                    </button>
                    <button
                      onClick={() => setAbaAtiva('comandas')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'comandas' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      💳 Comandas
                    </button>
                    <button
                      onClick={() => setAbaAtiva('cozinha')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'cozinha' ? 'bg-rose-500 text-slate-950' : 'text-rose-400'}`}
                    >
                      🔥 Cozinha
                    </button>
                    {(usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
                      <>
                        <button
                          onClick={() => setAbaAtiva('relatorios')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'relatorios' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'}`}
                        >
                          📊 Relatórios
                        </button>
                        <button
                          onClick={() => setAbaAtiva('gerenciar_cardapio')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'gerenciar_cardapio' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400'}`}
                        >
                          ⚙️ Cardápio
                        </button>
                        <button
                          onClick={() => setAbaAtiva('gerenciar_usuarios')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'gerenciar_usuarios' ? 'bg-indigo-500 text-slate-950' : 'text-indigo-400'}`}
                        >
                          👥 Usuários
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

              {usuarioLogado ? (
                <button
                  onClick={handleLogout}
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
                >
                  Sair
                </button>
              ) : (
                <button
                  onClick={() => setModalLoginAberto(true)}
                  className="bg-slate-800 border border-slate-700 text-cyan-400 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all"
                >
                  🔐 Login
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ALERTA APENAS PARA GESTOR / COZINHA */}
        {usuarioLogado && novoPedidoAlerta && (
          <div className="max-w-4xl mx-auto mb-4 p-4 bg-amber-500/20 border-2 border-amber-500 text-amber-300 rounded-2xl flex justify-between items-center animate-bounce shadow-2xl">
            <div>
              <span className="font-black text-sm block">🚨 NOVO PEDIDO CHEGOU! ({novoPedidoAlerta.local})</span>
              <span className="text-xs text-amber-200">Cliente: {novoPedidoAlerta.cliente}</span>
            </div>
            <button
              onClick={() => { setAbaAtiva('cozinha'); setNovoPedidoAlerta(null); }}
              className="bg-amber-500 text-slate-950 font-black px-3 py-2 rounded-xl text-xs shadow-lg"
            >
              Ver na Cozinha 👀
            </button>
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
                  <input
                    type="number"
                    placeholder="Número da Mesa (Ex: 01)"
                    value={mesaConsultaCliente}
                    onChange={(e) => setMesaConsultaCliente(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white"
                  />
                  <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs">
                    Consultar 🔎
                  </button>
                </form>

                {contaConsultada && (
                  <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                    {contaConsultada.status === 'nao_encontrada' && (
                      <p className="text-rose-400 font-bold">❌ Nenhuma comanda aberta para a Mesa {contaConsultada.local}.</p>
                    )}
                    {contaConsultada.status === 'encontrado' && (
                      <>
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                          <span className="font-black text-cyan-400 text-sm">{contaConsultada.local}</span>
                          <span className="text-base font-black text-emerald-400">Total: R$ {contaConsultada.total.toFixed(2)}</span>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {contaConsultada.pedidos.map((p, idx) => (
                            <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-400 block mb-1">Às {p.horario} • <strong className="text-cyan-300">{p.status}</strong></span>
                              {p.itens.map((it, i) => (
                                <div key={i} className="flex justify-between text-slate-300">
                                  <span>{it.quantidade}x {it.nome}</span>
                                  <span className="text-cyan-400">R$ {it.precoTotalItem.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <button onClick={solicitarFechamentoConta} className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs">
                          🛎️ Solicitar Fechamento de Conta
                        </button>
                        {contaSolicitadaSucesso && <p className="text-emerald-400 font-bold text-center mt-2">✅ Solicitada com sucesso!</p>}
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

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {categoriasUnicas.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoriaSel(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${categoriaSel === cat ? 'bg-cyan-500 text-slate-950 border-cyan-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {cardapioFiltrado.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => abrirDetalhesItem(item)}
                      className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center gap-4 hover:border-cyan-500/40 cursor-pointer transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-100">{item.nome}</h3>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">{item.categoria}</span>
                        </div>
                        {item.descricao && <p className="text-xs text-slate-400 mt-1">{item.descricao}</p>}
                        <p className="text-cyan-400 font-extrabold text-sm mt-2">R$ {item.preco.toFixed(2)}</p>
                      </div>
                      <button className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold px-3 py-2 rounded-lg text-xs">+ Opções</button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-slate-900 p-4 rounded-xl border border-slate-800 h-fit sticky top-4 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-100 mb-3 pb-2 border-b border-slate-800 flex justify-between items-center">
                    <span>Sua Sacola</span>
                    <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-0.5 rounded-full">{carrinho.length} itens</span>
                  </h2>
                  {carrinho.length === 0 ? (
                    <p className="text-slate-500 text-xs py-4 text-center">Nenhum item selecionado.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {carrinho.map((item, index) => (
                        <div key={index} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-300">{item.quantidade}x {item.nome}</span>
                            <span className="text-cyan-400">R$ {item.precoTotalItem.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-cyan-400 block border-b border-slate-800 pb-1">Identificação & Celular</span>
                    {!mesaAlvoGarcom && (
                      <>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                          <button type="button" onClick={() => setTipoAtendimento('mesa')} className={`py-1 text-xs font-bold rounded-md ${tipoAtendimento === 'mesa' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>Mesa</button>
                          <button type="button" onClick={() => setTipoAtendimento('avulso')} className={`py-1 text-xs font-bold rounded-md ${tipoAtendimento === 'avulso' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>Avulso</button>
                        </div>
                        {tipoAtendimento === 'mesa' ? (
                          <input type="number" placeholder="Número da Mesa" value={numMesa} onChange={(e) => setNumMesa(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-bold text-xs p-2 rounded-lg" />
                        ) : (
                          <input type="text" placeholder="Identificação (Ex: Balcão)" value={identificacaoAvulsa} onChange={(e) => setIdentificacaoAvulsa(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-bold text-xs p-2 rounded-lg" />
                        )}
                      </>
                    )}
                    <input type="text" placeholder="Seu Nome" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs p-2 rounded-lg" />
                    <input type="tel" placeholder="Celular / WhatsApp (Capturado/Digite)" value={celularCliente} onChange={(e) => setCelularCliente(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs p-2 rounded-lg" />
                  </div>

                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400">Total:</span>
                    <span className="text-cyan-400 text-base">R$ {totalCarrinho.toFixed(2)}</span>
                  </div>

                  <button onClick={enviarPedido} disabled={carrinho.length === 0} className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 font-extrabold py-3 rounded-xl text-xs shadow-lg">
                    Enviar para Cozinha
                  </button>
                </div>
              </section>
            </div>
          </main>
        )}

        {abaAtiva === 'salao' && usuarioLogado && (
          <main className="max-w-4xl mx-auto space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-100">Mapa Visual do Salão</h2>
                <p className="text-xs text-slate-400">Acompanhe abaixo o total consumido (A pagar) de cada mesa em tempo real.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {listaMesas.map((m) => (
                <div key={m.numero} className={`p-4 rounded-2xl border flex flex-col justify-between h-40 shadow-lg ${m.ocupada ? 'bg-rose-950/40 border-rose-500/50' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-black text-slate-400">Mesa</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.ocupada ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {m.ocupada ? 'OCUPADA' : 'LIVRE'}
                    </span>
                  </div>

                  <div className="my-1">
                    <span className="text-3xl font-black text-slate-100">{m.numero}</span>
                  </div>

                  {m.ocupada ? (
                    <div className="text-[11px] font-bold space-y-0.5 border-t border-rose-500/30 pt-1">
                      <span className="text-rose-400 block">A Pagar: R$ {m.dados.totalComanda.toFixed(2)}</span>
                      {m.dados.contaSolicitada && <span className="text-amber-400 block animate-pulse">🔔 Pediu a Conta!</span>}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 block">A Pagar: R$ 0,00</span>
                  )}

                  <button onClick={() => selecionarMesaParaLancar(m.numero)} className="mt-1 bg-cyan-500/20 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 border border-cyan-500/30 py-1.5 rounded-lg text-[11px] font-bold transition-all">
                    + Lançar
                  </button>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* PAINEL DO GARÇOM (CONTROLE DE ENTREGA) */}
        {abaAtiva === 'garcom' && usuarioLogado && (
          <main className="max-w-4xl mx-auto space-y-4">
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-emerald-400">🏃‍♂️ Painel do Garçom (Prontos para Entrega)</h2>
                <p className="text-xs text-slate-400">Marque os pedidos abaixo como entregues assim que levar até a mesa correspondente.</p>
              </div>
            </div>

            {pedidos.filter(p => p.status === 'Pronto').length === 0 ? (
              <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center text-slate-500 text-sm">
                Nenhum pedido pronto para entrega no momento. 🧊
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pedidos.filter(p => p.status === 'Pronto').map((p) => (
                  <div key={p.id} className={`bg-slate-900 p-4 rounded-xl border space-y-3 shadow-xl ${p.entregue ? 'border-emerald-500/50 opacity-60' : 'border-amber-500/80 animate-pulse'}`}>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-1 rounded text-xs">{p.local}</span>
                      <span className="text-xs text-slate-400">🕒 {p.horario}</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-300">Cliente: <strong>{p.cliente}</strong></p>
                      <p className="text-slate-400">Atendente/Origem: <strong>{p.atendente}</strong></p>
                    </div>

                    <ul className="space-y-1.5 text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      {p.itens.map((it, idx) => (
                        <li key={idx} className="flex justify-between text-slate-300">
                          <span>{it.quantidade}x {it.nome} {it.ponto ? `(${it.ponto})` : ''}</span>
                        </li>
                      ))}
                    </ul>

                    {p.entregue ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center py-2 rounded-lg text-xs font-bold">
                        ✓ Entregue na Mesa com Sucesso
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const novos = pedidos.map(item => item.id === p.id ? { ...item, entregue: true } : item);
                          setPedidos(novos);
                          socket.emit('atualizar_status_pedido', { idPedido: p.id, status: 'Pronto (Entregue)' });
                          setMensagem(`✅ Pedido da ${p.local} marcado como entregue!`);
                          setTimeout(() => setMensagem(''), 3000);
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg transition-all"
                      >
                        📦 Marcar como Entregue na Mesa
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {abaAtiva === 'comandas' && usuarioLogado && (
          <main className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Controle de Mesas & Comandas Abertas</h2>
            {Object.keys(comandasAgrupadas).length === 0 ? (
              <p className="text-slate-500 text-xs">Nenhuma comanda aberta no momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(comandasAgrupadas).map(([local, info]) => {
                  const podeFechar = usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor';
                  return (
                    <div key={local} className={`bg-slate-900 p-4 rounded-xl border space-y-3 ${info.contaSolicitada ? 'border-amber-500 shadow-xl' : 'border-slate-800'}`}>
                      <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-cyan-500 text-slate-950 font-black px-2 py-0.5 rounded text-xs">{local}</span>
                            {info.contaSolicitada && <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">🔔 Pediu Conta</span>}
                          </div>
                          <span className="text-xs text-slate-300 font-bold mt-1 block">{info.cliente}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-cyan-400 block">Total: R$ {info.totalComanda.toFixed(2)}</span>
                          {podeFechar && (
                            <button onClick={() => { setMesaFechamento(info); setPagamentosMesa({}); }} className="mt-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded text-[11px] font-black shadow">
                              📊 Fechar Conta (Gestor)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        )}

        {abaAtiva === 'relatorios' && usuarioLogado && (usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
          <main className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-amber-400">📊 Relatório Financeiro por Período</h2>
              
              <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-bold">De:</span>
                  <input type="date" value={dataInicioFiltro} onChange={(e) => setDataInicioFiltro(e.target.value)} className="bg-slate-900 border border-slate-800 text-cyan-400 text-xs p-2 rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-bold">Até:</span>
                  <input type="date" value={dataFimFiltro} onChange={(e) => setDataFimFiltro(e.target.value)} className="bg-slate-900 border border-slate-800 text-cyan-400 text-xs p-2 rounded-lg" />
                </div>
                <div className="flex gap-2 ml-auto">
                  <button onClick={definirHoje} className="bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-bold">Hoje</button>
                  <button onClick={definirOntem} className="bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-bold">Ontem</button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-300">Faturamento no Período:</span>
                <span className="text-2xl font-black text-emerald-400">R$ {faturamentoPeriodo.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-100">Histórico de Vendas do Período ({vendasFiltradasPorPeriodo.length} vendas)</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {vendasFiltradasPorPeriodo.length === 0 ? (
                  <p className="text-slate-500 text-xs">Nenhuma venda registrada neste período.</p>
                ) : (
                  vendasFiltradasPorPeriodo.map((v) => (
                    <div key={v.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-cyan-400">
                        <span>{v.local} • {v.cliente}</span>
                        <span className="text-emerald-400">R$ {v.total.toFixed(2)}</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">Fechado por {v.responsavelFechamento} às {v.horarioFechamento}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        )}

        {abaAtiva === 'cozinha' && usuarioLogado && (
          <main className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-lg font-black text-rose-400">🔥 Painel da Cozinha (KDS)</h2>
            {pedidos.length === 0 ? (
              <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center text-slate-500 text-sm">Nenhum pedido na cozinha.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pedidos.map((p) => (
                  <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 shadow-xl">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <span className="bg-rose-500 text-slate-950 font-black px-2 py-1 rounded text-xs">{p.local}</span>
                      <span className="text-xs text-slate-400">🕒 {p.horario}</span>
                    </div>
                    <ul className="space-y-2 text-xs">
                      {p.itens.map((it, idx) => (
                        <li key={idx} className="bg-slate-950 p-2 rounded border border-slate-800">
                          <div className="font-bold text-slate-200">{it.quantidade}x {it.nome}</div>
                        </li>
                      ))}
                    </ul>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <button onClick={() => atualizarStatusPedido(p.id, 'Preparando')} className="bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold py-2 rounded text-xs">Preparando</button>
                      <button onClick={() => atualizarStatusPedido(p.id, 'Pronto')} className="bg-emerald-500 text-slate-950 font-black py-2 rounded text-xs">Pronto!</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {abaAtiva === 'gerenciar_cardapio' && usuarioLogado && (usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
          <main className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-emerald-400">⚙️ Adicionar Produto ao Cardápio</h2>
              <form onSubmit={adicionarItemCardapio} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Nome do Item" value={novoNomeItem} onChange={(e) => setNovoNomeItem(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                <select value={novaCategoriaItem} onChange={(e) => setNovaCategoriaItem(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white">
                  <option value="Espetinhos">Espetinhos</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Porções">Porções</option>
                </select>
                <input type="number" step="0.01" placeholder="Preço (R$)" value={novoPrecoItem} onChange={(e) => setNovoPrecoItem(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                <input type="text" placeholder="Descrição" value={novaDescItem} onChange={(e) => setNovaDescItem(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                <button type="submit" className="sm:col-span-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs">Salvar no Banco</button>
              </form>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-100">Produtos Cadastrados</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cardapio.map((i) => (
                  <div key={i.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span>{i.nome} - R$ {i.preco.toFixed(2)}</span>
                    <button onClick={() => removerItemCardapio(i.id)} className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded font-bold">Remover</button>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {abaAtiva === 'gerenciar_usuarios' && usuarioLogado && (usuarioLogado.tipo === 'adm' || usuarioLogado.tipo === 'gestor') && (
          <main className="max-w-4xl mx-auto space-y-5">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-indigo-400">👥 Cadastrar Usuário</h2>
              <form onSubmit={cadastrarFuncionario} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Nome" value={novoNomeUser} onChange={(e) => setNovoNomeUser(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                <input type="text" placeholder="Login" value={novoUsuario} onChange={(e) => setNovoUsuario(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                <input type="password" placeholder="Senha" value={novoSenhaUser} onChange={(e) => setNovoSenhaUser(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                <select value={novoTipoUser} onChange={(e) => setNovoTipoUser(e.target.value)} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white">
                  <option value="garcom">Garçom</option>
                  <option value="gestor">Gestor</option>
                  <option value="adm">Administrador</option>
                </select>
                <button type="submit" className="sm:col-span-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black py-2.5 rounded-xl text-xs">Cadastrar Colaborador</button>
              </form>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-100">Usuários Ativos</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {listaUsuarios.map((u) => (
                  <div key={u.usuario} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span>{u.nome} ({u.usuario}) - <strong>{u.tipo}</strong></span>
                    {u.usuario !== 'admin' && <button onClick={() => removerFuncionario(u.usuario)} className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded font-bold">Remover</button>}
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {modalLoginAberto && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-bold text-base text-cyan-400">Login</h3>
                <button onClick={() => setModalLoginAberto(false)} className="text-slate-400 bg-slate-800 w-7 h-7 rounded-full text-xs font-bold">✕</button>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="text" placeholder="Usuário" value={inputUsuario} onChange={(e) => setInputUsuario(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                <input type="password" placeholder="Senha" value={inputSenha} onChange={(e) => setInputSenha(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                {erroLogin && <p className="text-xs font-bold text-rose-400 text-center">{erroLogin}</p>}
                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl text-xs">Entrar</button>
              </form>
            </div>
          </div>
        )}

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

        {pedidoEnviadoSucesso && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-black border border-emerald-500/40">✓</div>
              <div>
                <h3 className="text-xl font-black text-emerald-400">Pedido Realizado com Sucesso!</h3>
                <p className="text-xs text-slate-300 mt-1">Transmitido para a cozinha e garçons!</p>
              </div>
              <button onClick={() => setPedidoEnviadoSucesso(null)} className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg">Fazer Novo Pedido</button>
            </div>
          </div>
        )}

        {mesaFechamento && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 z-50">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="font-bold text-base text-cyan-400">Fechamento de Conta ({mesaFechamento.local})</h3>
                <button onClick={() => setMesaFechamento(null)} className="text-slate-400 bg-slate-800 w-7 h-7 rounded-full text-xs font-bold">✕</button>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Total a Pagar:</span>
                <span className="text-xl font-black text-emerald-400">R$ {mesaFechamento.totalComanda.toFixed(2)}</span>
              </div>
              <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 block">Formas de Pagamento:</span>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <div key={forma} className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                      <span>{forma}</span>
                      <input type="number" step="0.01" placeholder="R$ 0,00" value={pagamentosMesa[forma] || ''} onChange={(e) => setPagamentosMesa(prev => ({ ...prev, [forma]: e.target.value }))} className="w-20 bg-slate-950 border border-slate-800 p-1 rounded text-cyan-400 font-bold text-right" />
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => encerarComanda(mesaFechamento.local, mesaFechamento)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg">
                🏁 Confirmar Pagamento, Gravar Venda e Liberar Mesa
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