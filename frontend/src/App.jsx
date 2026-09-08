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
   * PACOTE 6: FUNÇÕES DE CARRINHO, OPÇÕES E PEDIDOS (COM MESA E AVULSO)
   * ============================================================================
   */
  const [modoAtendimentoSacola, setModoAtendimentoSacola] = useState('mesa'); // 'mesa' ou 'avulso'
  const [numeroMesaSacola, setNumeroMesaSacola] = useState('');

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
        // Pedido Avulso (Balcão / Retirada por Nome e Telefone)
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

                <div className="space-y-3 pt-2 border-t border-slate-800">
                  {/* Seletor do tipo de atendimento na sacola */}
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

                  {/* Campo de Número da Mesa se selecionado Mesa */}
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