/**
 * ============================================================================
 * PACOTE 1: IMPORTAÇÕES, CONFIGURAÇÕES E DADOS INICIAIS DO SISTEMA
 * ============================================================================
 */
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = "https://era-do-gelo-sistema.onrender.com"; 
const socket = io(BACKEND_URL);

// Versão dinâmica calculada no carregamento para controle de cache
const VERSAO_SISTEMA = (() => {
  const agora = new Date();
  const dataFmt = agora.toLocaleDateString('pt-BR');
  const horaFmt = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `v3.10.0 • Compilado em ${dataFmt} às ${horaFmt}`;
})();

// Cardápio completo padrão pré-cadastrado
const CARDAPIO_PADRAO_COMPLETO = [
  { id: 101, nome: 'Espetinho de Boi (Alcatra)', categoria: 'Espetinhos', preco: 12.00, descricao: 'Carne macia com tempero especial', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true },
  { id: 102, nome: 'Espetinho de Frango com Bacon', categoria: 'Espetinhos', preco: 10.00, descricao: 'Frango suculento envolvido em bacon', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true },
  { id: 103, nome: 'Espetinho de Coração', categoria: 'Espetinhos', preco: 11.00, descricao: 'Coração de frango temperado', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true },
  { id: 104, nome: 'Espetinho de Kafta', categoria: 'Espetinhos', preco: 11.00, descricao: 'Carne moída temperada no espeto', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true },
  { id: 105, nome: 'Espetinho de Linguiça Toscana', categoria: 'Espetinhos', preco: 10.00, descricao: 'Linguiça suína artesanal', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true },
  { id: 106, nome: 'Espetinho de Queijo Coalho', categoria: 'Espetinhos', preco: 13.00, descricao: 'Queijo coalho assado na brasa', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true },
  { id: 107, nome: 'Espetinho de Pão de Alho', categoria: 'Espetinhos', preco: 9.00, descricao: 'Pão recheado com pasta de alho', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true },
  { id: 108, nome: 'Medalhão de Boi', categoria: 'Espetinhos', preco: 14.00, descricao: 'Alcatra enrolada no bacon', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true },
  
  { id: 201, nome: 'Heineken Long Neck 330ml', categoria: 'Cervejas', preco: 10.00, descricao: 'Cerveja Puro Malte gelada', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 202, nome: 'Budweiser Long Neck 330ml', categoria: 'Cervejas', preco: 9.00, descricao: 'American Lager', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 203, nome: 'Amstel Lata 350ml', categoria: 'Cervejas', preco: 7.00, descricao: 'Puro Malte refrescante', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 204, nome: 'Skol Lata 350ml', categoria: 'Cervejas', preco: 6.00, descricao: 'A cerveja que desce redondo', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 205, nome: 'Brahma Duplo Malte Lata 350ml', categoria: 'Cervejas', preco: 7.00, descricao: 'Sabor encorpado', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 206, nome: 'Stella Artois Long Neck 330ml', categoria: 'Cervejas', preco: 10.00, descricao: 'Puro malte belga', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 207, nome: 'Original 600ml (Retornável)', categoria: 'Cervejas', preco: 15.00, descricao: 'Para mesa (Garrafa)', impressora: 'Bar 1', destino: 'bar', ativo: true },

  { id: 301, nome: 'Coca-Cola Lata 350ml', categoria: 'Refrigerantes', preco: 6.50, descricao: 'Refrigerante sabor cola', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 302, nome: 'Coca-Cola Zero Lata 350ml', categoria: 'Refrigerantes', preco: 6.50, descricao: 'Sem açúcar', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 303, nome: 'Guaraná Antarctica Lata 350ml', categoria: 'Refrigerantes', preco: 6.00, descricao: 'O original do Brasil', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 304, nome: 'Guaraná Zero Lata 350ml', categoria: 'Refrigerantes', preco: 6.00, descricao: 'Guaraná zero açúcar', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 305, nome: 'Sprite Lata 350ml', categoria: 'Refrigerantes', preco: 6.00, descricao: 'Sabor limão', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 306, nome: 'Fanta Laranja Lata 350ml', categoria: 'Refrigerantes', preco: 6.00, descricao: 'Sabor laranja', impressora: 'Bar 1', destino: 'bar', ativo: true },
  { id: 307, nome: 'Coca-Cola 2 Litros (Pet)', categoria: 'Refrigerantes', preco: 14.00, descricao: 'Para compartilhar na mesa', impressora: 'Bar 1', destino: 'bar', ativo: true },

  { id: 401, nome: 'Porção de Fritas com Bacon e Cheddar', categoria: 'Porções', preco: 38.00, descricao: 'Batata crocante com cheddar e bacon', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true },
  { id: 402, nome: 'Porção de Mandioca Frita', categoria: 'Porções', preco: 28.00, descricao: 'Mandioca macia e crocante', impressora: 'Cozinha 1', destino: 'cozinha', ativo: true }
];

const USUARIOS_PADRAO_INICIAL = [
  { usuario: 'admin', senha: '@adm123', nome: 'Administrador Geral', tipo: 'adm' },
  { usuario: 'gestor1', senha: '123', nome: 'Carlos (Gestor)', tipo: 'gestor' },
  { usuario: 'garcom1', senha: '123', nome: 'João (Garçom)', tipo: 'garcom' }
];

export default function App() {
  /**
   * ============================================================================
   * PACOTE 2: GERENCIAMENTO DE ESTADOS E FILTROS DE PESQUISA NO BANCO
   * ============================================================================
   */
  const [bancoConectado, setBancoConectado] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState(null); 
  const [modalLoginAberto, setModalLoginAberto] = useState(false);
  
  const [inputUsuario, setInputUsuario] = useState('');
  const [inputSenha, setInputSenha] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  const [listaUsuarios, setListaUsuarios] = useState(USUARIOS_PADRAO_INICIAL);
  
  // Estados para Edição de Usuários
  const [editandoUserLogin, setEditandoUserLogin] = useState(null);
  const [novoUsuario, setNovoUsuario] = useState('');
  const [novoSenhaUser, setNovoSenhaUser] = useState('');
  const [novoNomeUser, setNovoNomeUser] = useState('');
  const [novoTipoUser, setNovoTipoUser] = useState('garcom');

  const [abaAtiva, setAbaAtiva] = useState('cardapio');
  const [categoriaSel, setCategoriaSel] = useState('Todas');
  const [cardapio, setCardapio] = useState(CARDAPIO_PADRAO_COMPLETO);
  const [carrinho, setCarrinho] = useState([]);
  
  const [pedidos, setPedidos] = useState([]);
  const [historicoVendas, setHistoricoVendas] = useState([]);
  const [clientesBanco, setClientesBanco] = useState([]);

  // Termos de Pesquisa Geral no Banco
  const [termoPesquisaProdutos, setTermoPesquisaProdutos] = useState('');
  const [termoPesquisaUsuarios, setTermoPesquisaUsuarios] = useState('');

  // Quantidade de Mesas configurável
  const [totalMesasSalao, setTotalMesasSalao] = useState(() => {
    const salva = localStorage.getItem('eradogelo_total_mesas');
    return salva ? Number(salva) : 15;
  });
  const [inputTotalMesasAdm, setInputTotalMesasAdm] = useState(totalMesasSalao);

  const [configImpressoras, setConfigImpressoras] = useState({
    cozinha1: '\\\\SERVIDOR\\Cozinha1',
    bar1: '\\\\SERVIDOR\\Bar1'
  });

  const hojeStr = new Date().toISOString().split('T')[0];
  const [dataInicioFiltro, setDataInicioFiltro] = useState(hojeStr);
  const [dataFimFiltro, setDataFimFiltro] = useState(hojeStr);

  const [mesaConsultaCliente, setMesaConsultaCliente] = useState('');
  const [contaConsultada, setContaConsultada] = useState(null);
  const [contaSolicitadaSucesso, setContaSolicitadaSucesso] = useState(false);

  const [mesaAlvoGarcom, setMesaAlvoGarcom] = useState(null);

  // Estados do CRUD de Produtos
  const [editandoProdutoId, setEditandoProdutoId] = useState(null);
  const [novoNomeItem, setNovoNomeItem] = useState('');
  const [novaCategoriaItem, setNovaCategoriaItem] = useState('Espetinhos');
  const [novoPrecoItem, setNovoPrecoItem] = useState('');
  const [novaDescItem, setNovaDescItem] = useState('');
  const [novoDestinoItem, setNovoDestinoItem] = useState('cozinha');
  const [novoAtivoItem, setNovoAtivoItem] = useState(true);

  const [celularCliente, setCelularCliente] = useState(() => localStorage.getItem('eradogelo_cliente_celular') || '');
  const [nomeCliente, setNomeCliente] = useState(() => localStorage.getItem('eradogelo_cliente_nome') || '');
  const [mensagem, setMensagem] = useState('');

  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [quantidadeModal, setQuantidadeModal] = useState(1);
  const [pontoCarne, setPontoCarne] = useState('Ao ponto');
  const [opcaoMolhoEspetinho, setOpcaoMolhoEspetinho] = useState('Molho e farinha');

  const [mesaFechamento, setMesaFechamento] = useState(null);
  const [pagamentosMesa, setPagamentosMesa] = useState({});

  const [modoAtendimentoSacola, setModoAtendimentoSacola] = useState('mesa');
  const [numeroMesaSacola, setNumeroMesaSacola] = useState('');

  /**
   * ============================================================================
   * PACOTE 3: CONEXÃO SOCKET.IO E SINCRONIZAÇÃO EM TEMPO REAL
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

    return () => {
      socket.off('connect');
      socket.off('atualizar_lista_pedidos');
      socket.off('atualizar_cardapio');
      socket.off('atualizar_usuarios');
      socket.off('atualizar_vendas');
      socket.off('atualizar_clientes');
      socket.off('atualizar_config_impressora');
    };
  }, []);

  /**
   * ============================================================================
   * PACOTE 4: AUTENTICAÇÃO E SESSÃO
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
   * PACOTE 5: GESTÃO E ALTERAÇÃO DE CADASTROS (PRODUTOS, USUÁRIOS E MESAS)
   * ============================================================================
   */
  function alterarQuantidadeMesas(e) {
    e.preventDefault();
    const qtd = Number(inputTotalMesasAdm);
    if (!qtd || qtd < 1) {
      setMensagem('⚠️ Informe um número válido de mesas!');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }
    setTotalMesasSalao(qtd);
    localStorage.setItem('eradogelo_total_mesas', qtd);
    setMensagem(`🪑 Salão atualizado para ${qtd} mesas!`);
    setTimeout(() => setMensagem(''), 3000);
  }

  function cadastrarOuEditarProduto(e) {
    try {
      e.preventDefault();
      if (!novoNomeItem || !novoPrecoItem) return;

      let novoCardapio = [...cardapio];

      if (editandoProdutoId) {
        novoCardapio = novoCardapio.map(item => {
          if (item.id === editandoProdutoId) {
            return {
              ...item,
              nome: novoNomeItem,
              categoria: novaCategoriaItem,
              preco: Number(novoPrecoItem),
              descricao: novaDescItem,
              destino: novoDestinoItem,
              ativo: novoAtivoItem,
              impressora: novoDestinoItem === 'cozinha' ? 'Cozinha 1' : novoDestinoItem === 'bar' ? 'Bar 1' : 'Balcão'
            };
          }
          return item;
        });
      } else {
        const novo = {
          id: Date.now(),
          nome: novoNomeItem,
          categoria: novaCategoriaItem,
          preco: Number(novoPrecoItem),
          descricao: novaDescItem,
          destino: novoDestinoItem,
          ativo: novoAtivoItem,
          impressora: novoDestinoItem === 'cozinha' ? 'Cozinha 1' : novoDestinoItem === 'bar' ? 'Bar 1' : 'Balcão'
        };
        novoCardapio.push(novo);
      }

      setCardapio(novoCardapio);
      socket.emit('salvar_cardapio', novoCardapio);

      setEditandoProdutoId(null);
      setNovoNomeItem('');
      setNovoPrecoItem('');
      setNovaDescItem('');
      setNovoAtivoItem(true);
      setMensagem('✅ Produto salvo com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (erro) {
      console.error("❌ [ERRO] Função cadastrarOuEditarProduto:", erro);
    }
  }

  function carregarProdutoParaEdicao(item) {
    setEditandoProdutoId(item.id);
    setNovoNomeItem(item.nome);
    setNovaCategoriaItem(item.categoria);
    setNovoPrecoItem(item.preco);
    setNovaDescItem(item.descricao || '');
    setNovoDestinoItem(item.destino || 'cozinha');
    setNovoAtivoItem(item.ativo !== false);
  }

  function alternarAtivacaoProduto(id) {
    const novoCardapio = cardapio.map(item => {
      if (item.id === id) {
        return { ...item, ativo: !item.ativo };
      }
      return item;
    });
    setCardapio(novoCardapio);
    socket.emit('salvar_cardapio', novoCardapio);
  }

  function cadastrarOuEditarFuncionario(e) {
    try {
      e.preventDefault();
      if (!novoUsuario || !novoSenhaUser || !novoNomeUser) return;

      let novaLista = [...listaUsuarios];

      if (editandoUserLogin) {
        novaLista = novaLista.map(u => {
          if (u.usuario === editandoUserLogin) {
            return {
              ...u,
              nome: novoNomeUser.trim(),
              senha: novoSenhaUser,
              tipo: novoTipoUser
            };
          }
          return u;
        });
      } else {
        const existe = novaLista.find(u => u.usuario.toLowerCase() === novoUsuario.trim().toLowerCase());
        if (existe) {
          setMensagem('⚠️ Este usuário de login já existe!');
          setTimeout(() => setMensagem(''), 3000);
          return;
        }
        const novo = { usuario: novoUsuario.trim(), senha: novoSenhaUser, nome: novoNomeUser.trim(), tipo: novoTipoUser };
        novaLista.push(novo);
      }

      setListaUsuarios(novaLista);
      socket.emit('salvar_usuarios', novaLista);

      setEditandoUserLogin(null);
      setNovoUsuario('');
      setNovoSenhaUser('');
      setNovoNomeUser('');
      setMensagem('✅ Colaborador salvo com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (erro) {
      console.error("❌ [ERRO] Função cadastrarOuEditarFuncionario:", erro);
    }
  }

  function carregarUsuarioParaEdicao(user) {
    setEditandoUserLogin(user.usuario);
    setNovoUsuario(user.usuario);
    setNovoSenhaUser(user.senha);
    setNovoNomeUser(user.nome);
    setNovoTipoUser(user.tipo);
  }

  function removerFuncionario(userLogin) {
    if (userLogin === 'admin') {
      setMensagem('⚠️ Não é permitido remover o administrador principal!');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }
    const novaLista = listaUsuarios.filter(u => u.usuario !== userLogin);
    setListaUsuarios(novaLista);
    socket.emit('salvar_usuarios', novaLista);
    setMensagem('🗑️ Colaborador removido.');
    setTimeout(() => setMensagem(''), 3000);
  }

  /**
   * ============================================================================
   * PACOTE 6: PEDIDOS, SACOLA, COZINHA E CAIXA
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

  function abrirModalItem(item) {
    setItemSelecionado(item);
    setQuantidadeModal(1);
    setPontoCarne('Ao ponto');
    setOpcaoMolhoEspetinho('Molho e farinha');
  }

  function adicionarAoCarrinho() {
    if (!itemSelecionado) return;
    const precoUnitario = itemSelecionado.preco;
    const precoTotalItem = precoUnitario * quantidadeModal;

    const itemCarrinho = {
      ...itemSelecionado,
      quantidade: quantidadeModal,
      ponto: itemSelecionado.categoria === 'Espetinhos' ? pontoCarne : null,
      complementoMolho: itemSelecionado.categoria === 'Espetinhos' ? opcaoMolhoEspetinho : null,
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

      socket.emit('novo_pedido', pedidoObjeto);
      setCarrinho([]);
      setMesaAlvoGarcom(null);
      setNumeroMesaSacola('');
      setMensagem('✅ Pedido enviado com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
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
      setAbaAtiva('cardapio');
    } catch (erro) {
      console.error("❌ [ERRO] Função selecionarMesaParaLancar:", erro);
    }
  }

  // Cálculos dinâmicos, filtros de busca no banco local/socket
  const cardapioVisivel = cardapio.filter(i => i.ativo !== false);
  const categoriasUnicas = ['Todas', ...new Set(cardapioVisivel.map((item) => item.categoria))];
  
  const cardapioFiltrado = cardapioVisivel.filter(i => {
    const matchCat = categoriaSel === 'Todas' || i.categoria === categoriaSel;
    const matchBusca = i.nome.toLowerCase().includes(termoPesquisaProdutos.toLowerCase()) || 
                       i.categoria.toLowerCase().includes(termoPesquisaProdutos.toLowerCase());
    return matchCat && matchBusca;
  });

  const usuariosFiltrados = listaUsuarios.filter(u => 
    u.nome.toLowerCase().includes(termoPesquisaUsuarios.toLowerCase()) || 
    u.usuario.toLowerCase().includes(termoPesquisaUsuarios.toLowerCase()) ||
    u.tipo.toLowerCase().includes(termoPesquisaUsuarios.toLowerCase())
  );

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

  const listaMesas = Array.from({ length: totalMesasSalao }, (_, i) => {
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
   * PACOTE 7: RENDERIZAÇÃO DA INTERFACE DO USUÁRIO (JSX COMPLETO)
   * ============================================================================
   */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* 1. Cabeçalho Superior */}
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
                  🪑 Salão ({totalMesasSalao})
                </button>
                <button 
                  onClick={() => setAbaAtiva('cozinha')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${abaAtiva === 'cozinha' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  🍳 Cozinha/Bar
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

      {/* Alerta Instantâneo */}
      {mensagem && (
        <div className="bg-cyan-500 text-slate-950 font-bold px-4 py-2 text-center text-xs shadow-lg animate-pulse">
          {mensagem}
        </div>
      )}

      {/* 2. Conteúdo Principal */}
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

        {/* ABA CARDÁPIO & PESQUISA DE PRODUTOS */}
        {abaAtiva === 'cardapio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              
              {/* Barra de Pesquisa Rápida de Produtos */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex gap-2 items-center">
                <span className="text-sm">🔍</span>
                <input 
                  type="text" 
                  placeholder="Pesquisar produto no banco por nome ou categoria..." 
                  value={termoPesquisaProdutos}
                  onChange={(e) => setTermoPesquisaProdutos(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-xs text-white"
                />
                {termoPesquisaProdutos && (
                  <button onClick={() => setTermoPesquisaProdutos('')} className="text-xs bg-slate-800 px-2.5 py-1 rounded text-slate-400">
                    Limpar
                  </button>
                )}
              </div>

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
                      <span className="inline-block mt-2 text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        Destino: {item.destino ? item.destino.toUpperCase() : 'COZINHA'}
                      </span>
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
                      <span>
                        {item.quantidade}x {item.nome} 
                        {item.ponto ? ` (${item.ponto})` : ''} 
                        {item.complementoMolho ? ` [${item.complementoMolho}]` : ''}
                      </span>
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
                    <label className="text-[11px] text-cyan-400 block font-bold">Número da Mesa (1 a {totalMesasSalao}):</label>
                    <input 
                      type="number" 
                      min="1"
                      max={totalMesasSalao}
                      placeholder={`Ex: 01`} 
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

        {/* ABA CONSULTAR CONTA */}
        {abaAtiva === 'consultar' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-center">Consultar Conta da Mesa</h2>
            <form onSubmit={consultarContaPorMesa} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Número da Mesa:</label>
                <input 
                  type="number" 
                  min="1"
                  max={totalMesasSalao}
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

        {/* ABA SALÃO */}
        {abaAtiva === 'salao' && usuarioLogado && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold">Salão - Visitas & Mesas</h2>
                <span className="text-xs text-slate-400">Capacidade atual configurada: <b>{totalMesasSalao} Mesas</b></span>
              </div>
            </div>

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

        {/* ABA COZINHA / BAR */}
        {abaAtiva === 'cozinha' && usuarioLogado && (
          <div className="space-y-4">
            <h2 className="text-base font-bold">Painel de Cozinha, Bar e Balcão</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pedidos.filter(p => !p.cancelado && p.status !== 'Entregue').length === 0 ? (
                <p className="text-slate-500 text-xs py-8 text-center col-span-full">Nenhum pedido pendente nos setores.</p>
              ) : (
                pedidos.filter(p => !p.cancelado && p.status !== 'Entregue').map(pedido => (
                  <div key={pedido.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-extrabold text-sm text-cyan-400">{pedido.local}</span>
                      <span className="text-xs bg-slate-800 px-2.5 py-1 rounded text-slate-300">{pedido.horario}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {pedido.itens.map((i, idx) => (
                        <div key={idx} className="flex justify-between border-b border-slate-900/50 pb-1">
                          <span>
                            <b>{i.quantidade}x</b> {i.nome} 
                            {i.ponto ? ` (${i.ponto})` : ''} 
                            {i.complementoMolho ? ` [${i.complementoMolho}]` : ''}
                          </span>
                          <span className="text-[10px] text-slate-500 uppercase">{i.destino || 'cozinha'}</span>
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

        {/* ABA CAIXA */}
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

        {/* ABA PAINEL GARÇOM */}
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

        {/* ABA PAINEL ADM (COM PESQUISA E EDIÇÃO COMPLETA DE TODOS OS CADASTROS) */}
        {abaAtiva === 'config' && usuarioLogado && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloco 1: Configuração de Mesas */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4 h-fit md:col-span-2">
              <h3 className="text-xs font-bold text-cyan-400">🪑 Configurar Quantidade de Mesas do Salão</h3>
              <form onSubmit={alterarQuantidadeMesas} className="flex gap-3 items-end">
                <div className="flex-grow">
                  <label className="text-[11px] text-slate-400 block mb-1">Total de Mesas Ativas no Estabelecimento:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={inputTotalMesasAdm} 
                    onChange={(e) => setInputTotalMesasAdm(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-xs text-white font-bold" 
                    required 
                  />
                </div>
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded text-xs">
                  Salvar Nova Quantidade
                </button>
              </form>
            </div>

            {/* Bloco 2: Gestão, Pesquisa e Edição de Produtos */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-cyan-400">
                  {editandoProdutoId ? '✏️ Editando Produto' : '➕ Cadastrar / Editar Produto'}
                </h3>
                {editandoProdutoId && (
                  <button 
                    onClick={() => {
                      setEditandoProdutoId(null);
                      setNovoNomeItem('');
                      setNovoPrecoItem('');
                      setNovaDescItem('');
                      setNovoAtivoItem(true);
                    }} 
                    className="text-[10px] bg-slate-800 text-rose-400 px-2 py-1 rounded font-bold"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

              <form onSubmit={cadastrarOuEditarProduto} className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nome do Produto:</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Heineken Long Neck 330ml" 
                    value={novoNomeItem} 
                    onChange={(e) => setNovoNomeItem(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Categoria:</label>
                    <select 
                      value={novaCategoriaItem} 
                      onChange={(e) => setNovaCategoriaItem(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
                    >
                      <option value="Espetinhos">Espetinhos</option>
                      <option value="Cervejas">Cervejas</option>
                      <option value="Refrigerantes">Refrigerantes</option>
                      <option value="Porções">Porções</option>
                      <option value="Bebidas">Bebidas</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Preço (R$):</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={novoPrecoItem} 
                      onChange={(e) => setNovoPrecoItem(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Descrição Curta:</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Gelada 330ml" 
                    value={novaDescItem} 
                    onChange={(e) => setNovaDescItem(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Destino (Setor):</label>
                    <select 
                      value={novoDestinoItem} 
                      onChange={(e) => setNovoDestinoItem(e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white font-bold text-cyan-300"
                    >
                      <option value="cozinha">🍳 Cozinha</option>
                      <option value="bar">🍺 Bar</option>
                      <option value="balcao">🏪 Balcão</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Status no Cardápio:</label>
                    <button 
                      type="button"
                      onClick={() => setNovoAtivoItem(!novoAtivoItem)}
                      className={`w-full py-2 rounded text-xs font-bold border transition-all ${novoAtivoItem ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-rose-950 border-rose-800 text-rose-400'}`}
                    >
                      {novoAtivoItem ? '🟢 Ativo (Visível)' : '🔴 Inativo (Oculto)'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded text-xs shadow-md">
                  {editandoProdutoId ? '💾 Atualizar Produto' : '✨ Cadastrar Produto'}
                </button>
              </form>

              {/* Caixa de Pesquisa de Produtos na Configuração */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <input 
                  type="text" 
                  placeholder="🔍 Pesquisar produto para editar..." 
                  value={termoPesquisaProdutos}
                  onChange={(e) => setTermoPesquisaProdutos(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
                />
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {cardapio.filter(p => p.nome.toLowerCase().includes(termoPesquisaProdutos.toLowerCase())).map(prod => (
                    <div key={prod.id} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-xs">
                      <div className="truncate pr-2">
                        <span className={`font-bold ${prod.ativo !== false ? 'text-white' : 'text-slate-500 line-through'}`}>
                          {prod.nome}
                        </span>
                        <span className="text-[10px] text-cyan-400 ml-2">R$ {prod.preco.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => alternarAtivacaoProduto(prod.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${prod.ativo !== false ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}
                        >
                          {prod.ativo !== false ? 'Ativo' : 'Inativo'}
                        </button>
                        <button 
                          onClick={() => carregarProdutoParaEdicao(prod)}
                          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bloco 3: Gestão, Pesquisa e Edição de Colaboradores */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4 h-fit">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-cyan-400">
                  {editandoUserLogin ? '✏️ Editando Colaborador' : '👤 Cadastrar / Editar Colaborador'}
                </h3>
                {editandoUserLogin && (
                  <button 
                    onClick={() => {
                      setEditandoUserLogin(null);
                      setNovoUsuario('');
                      setNovoSenhaUser('');
                      setNovoNomeUser('');
                    }} 
                    className="text-[10px] bg-slate-800 text-rose-400 px-2 py-1 rounded font-bold"
                  >
                    Cancelar Edição
                  </button>
                )}
              </div>

              <form onSubmit={cadastrarOuEditarFuncionario} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  value={novoNomeUser} 
                  onChange={(e) => setNovoNomeUser(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                  required
                />
                <input 
                  type="text" 
                  placeholder="Usuário de Login" 
                  value={novoUsuario} 
                  disabled={editandoUserLogin !== null}
                  onChange={(e) => setNovoUsuario(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white disabled:opacity-50" 
                  required
                />
                <input 
                  type="password" 
                  placeholder="Senha" 
                  value={novoSenhaUser} 
                  onChange={(e) => setNovoSenhaUser(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white" 
                  required
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
                  {editandoUserLogin ? '💾 Atualizar Colaborador' : '✨ Cadastrar Colaborador'}
                </button>
              </form>

              {/* Caixa de Pesquisa de Usuários */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <input 
                  type="text" 
                  placeholder="🔍 Pesquisar usuário..." 
                  value={termoPesquisaUsuarios}
                  onChange={(e) => setTermoPesquisaUsuarios(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
                />
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {usuariosFiltrados.map(user => (
                    <div key={user.usuario} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white">{user.nome}</span>
                        <span className="text-[10px] text-slate-400 block">Login: {user.usuario} ({user.tipo})</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button 
                          onClick={() => carregarUsuarioParaEdicao(user)}
                          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold"
                        >
                          Editar
                        </button>
                        {user.usuario !== 'admin' && (
                          <button 
                            onClick={() => removerFuncionario(user.usuario)}
                            className="bg-rose-950 text-rose-400 px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 3. Modal de Item */}
      {itemSelecionado && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-bold text-sm text-cyan-300">{itemSelecionado.nome}</h3>
            
            {itemSelecionado.categoria === 'Espetinhos' && (
              <>
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

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block">Opção de Molho / Farinha:</label>
                  <select 
                    value={opcaoMolhoEspetinho} 
                    onChange={(e) => setOpcaoMolhoEspetinho(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-cyan-300 font-bold"
                  >
                    <option value="Molho e farinha">Molho e farinha</option>
                    <option value="Farinha">Somente Farinha</option>
                    <option value="Puro">Puro (Sem molho e sem farinha)</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-400 block">Quantidade:</label>
              <input 
                type="number" 
                min="1" 
                value={quantidadeModal} 
                onChange={(e) => setQuantidadeModal(Number(e.target.value))} 
                className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white font-bold" 
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

      {/* 4. Modal de Login */}
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

      {/* 5. Modal de Fechamento de Comanda */}
      {mesaFechamento && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="font-bold text-sm">Fechamento de Comanda: {mesaFechamento.local}</h3>
            <p className="text-xs text-slate-400">Total a Pagar: <b className="text-cyan-400 text-sm">R$ {mesaFechamento.totalComanda.toFixed(2)}</b></p>
            
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block">Formas de Pagamento:</label>
              {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito'].map(forma => (
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

      {/* Rodapé Dinâmico */}
      <footer className="w-full py-2 px-4 border-t border-slate-900 bg-slate-950/60 text-center">
        <span className="text-[10px] text-slate-500 tracking-wider">
          Era do Gelo • {VERSAO_SISTEMA}
        </span>
      </footer>
    </div>
  );
}