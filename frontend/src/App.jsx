import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Coloque aqui o link exato que o Render te deu (sem a barra "/" no final)
const BACKEND_URL = "https://era-do-gelo.onrender.com"; 
const socket = io(BACKEND_URL);

const TOTAL_MESAS_SALAO = 15; // Defina aqui o total de mesas do salão

const OPCOES_MOLHOS = [
  'Molho Alho Caseiro',
  'Molho Barbecue',
  'Molho Verde / Cheiro Verde',
  'Molho Picante / Pimenta',
  'Sem Molho'
];

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('salao'); // 'salao', 'cardapio', 'comandas', 'cozinha'
  const [categoriaSel, setCategoriaSel] = useState('Todas');
  const [cardapio, setCardapio] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  // Base de Clientes (LocalStorage)
  const [clientesSalvos, setClientesSalvos] = useState(() => {
    const dados = localStorage.getItem('eradogelo_clientes');
    return dados ? JSON.parse(dados) : {};
  });

  // Controle de Atendimento
  const [tipoAtendimento, setTipoAtendimento] = useState('mesa');
  const [numMesa, setNumMesa] = useState('');
  const [identificacaoAvulsa, setIdentificacaoAvulsa] = useState('');
  const [celularCliente, setCelularCliente] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');

  const [mensagem, setMensagem] = useState('');

  // Modal Item
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [quantidadeModal, setQuantidadeModal] = useState(1);
  const [pontoCarne, setPontoCarne] = useState('Ao ponto');
  const [molhosSelecionados, setMolhosSelecionados] = useState([]);
  const [observacao, setObservacao] = useState('');

  // Fechamento de Mesa & Divisão
  const [mesaFechamento, setMesaFechamento] = useState(null);
  const [tipoDivisao, setTipoDivisao] = useState('pessoa');
  const [qtdPessoas, setQtdPessoas] = useState(1);

  useEffect(() => {
    fetch(`http://${HOST}:3001/api/cardapio`)
      .then((res) => res.json())
      .then((dados) => setCardapio(dados))
      .catch((err) => console.error(err));

    socket.on('pedido_recebido', (novoPedido) => {
      setPedidos((prev) => [novoPedido, ...prev]);
    });

    socket.on('cardapio_atualizado', (novoCardapio) => {
      setCardapio(novoCardapio);
    });

    return () => {
      socket.off('pedido_recebido');
      socket.off('cardapio_atualizado');
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('eradogelo_clientes', JSON.stringify(clientesSalvos));
  }, [clientesSalvos]);

  const handleCelularChange = (e) => {
    const tel = e.target.value;
    setCelularCliente(tel);
    if (clientesSalvos[tel]) {
      setNomeCliente(clientesSalvos[tel]);
    }
  };

  const categoriasUnicas = ['Todas', ...new Set(cardapio.map((item) => item.categoria))];

  const abrirDetalhesItem = (item) => {
    setItemSelecionado(item);
    setQuantidadeModal(1);
    setPontoCarne('Ao ponto');
    setMolhosSelecionados([]);
    setObservacao('');
  };

  const alternarMolho = (molho) => {
    if (molho === 'Sem Molho') {
      setMolhosSelecionados(['Sem Molho']);
      return;
    }
    setMolhosSelecionados((prev) => {
      const filtrados = prev.filter((m) => m !== 'Sem Molho');
      return filtrados.includes(molho)
        ? filtrados.filter((m) => m !== molho)
        : [...filtrados, molho];
    });
  };

  const confirmarAdicaoModal = () => {
    if (!itemSelecionado) return;

    const novoItemCarrinho = {
      ...itemSelecionado,
      quantidade: quantidadeModal,
      ponto: itemSelecionado.categoria === 'Espetinhos' ? pontoCarne : null,
      molhos: molhosSelecionados,
      obs: observacao,
      precoTotalItem: itemSelecionado.preco * quantidadeModal
    };

    setCarrinho((prev) => [...prev, novoItemCarrinho]);
    setItemSelecionado(null);
  };

  const enviarPedido = () => {
    if (carrinho.length === 0) return;

    let identificadorFinal = '';

    if (tipoAtendimento === 'mesa') {
      if (!numMesa || numMesa.trim() === '') {
        setMensagem('⚠️ Informe o NÚMERO DA MESA!');
        setTimeout(() => setMensagem(''), 4000);
        return;
      }
      identificadorFinal = `Mesa ${numMesa}`;
    } else {
      if (!identificacaoAvulsa || identificacaoAvulsa.trim() === '') {
        setMensagem('⚠️ Informe a identificação do Pedido Avulso!');
        setTimeout(() => setMensagem(''), 4000);
        return;
      }
      identificadorFinal = `AVULSO: ${identificacaoAvulsa}`;
    }

    if (!celularCliente || celularCliente.trim() === '') {
      setMensagem('⚠️ Informe o CELULAR do cliente!');
      setTimeout(() => setMensagem(''), 4000);
      return;
    }

    if (!nomeCliente || nomeCliente.trim() === '') {
      setMensagem('⚠️ Informe o NOME do cliente!');
      setTimeout(() => setMensagem(''), 4000);
      return;
    }

    setClientesSalvos((prev) => ({
      ...prev,
      [celularCliente]: nomeCliente
    }));

    const totalCalculado = carrinho.reduce((acc, item) => acc + item.precoTotalItem, 0);

    socket.emit('novo_pedido', {
      local: identificadorFinal,
      tipo: tipoAtendimento,
      mesa: tipoAtendimento === 'mesa' ? String(numMesa).padStart(2, '0') : 'Avulso',
      cliente: nomeCliente,
      celular: celularCliente,
      itens: carrinho,
      total: totalCalculado,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    setCarrinho([]);
    setMensagem(`✅ Pedido adicionado para ${identificadorFinal}!`);
    setTimeout(() => setMensagem(''), 4000);
  };

  // Agrupamento de Comandas Por Mesa / Avulso
  const comandasAgrupadas = pedidos.reduce((acc, pedido) => {
    const chave = pedido.local || `Mesa ${pedido.mesa}`;
    if (!acc[chave]) {
      acc[chave] = {
        local: chave,
        cliente: pedido.cliente,
        celular: pedido.celular,
        pedidos: [],
        totalComanda: 0
      };
    }
    acc[chave].pedidos.push(pedido);
    acc[chave].totalComanda += pedido.total;
    return acc;
  }, {});

  // Fechar/Encerrar Mesa
  const encerarComanda = (localChave) => {
    setPedidos((prev) => prev.filter((p) => (p.local || `Mesa ${p.mesa}`) !== localChave));
    setMesaFechamento(null);
    setMensagem(`🏁 Comanda ${localChave} fechada e liberada com sucesso!`);
    setTimeout(() => setMensagem(''), 4000);
  };

  // Abrir / Lançar para uma mesa específica clicando no Salão
  const selecionarMesaSalao = (numeroMesa) => {
    const numFormatado = String(numeroMesa).padStart(2, '0');
    setTipoAtendimento('mesa');
    setNumMesa(numFormatado);

    // Se a mesa já está ocupada, abre os detalhes dela
    const chaveMesa = `Mesa ${numFormatado}`;
    if (comandasAgrupadas[chaveMesa]) {
      setMesaFechamento(comandasAgrupadas[chaveMesa]);
      setQtdPessoas(1);
    } else {
      // Se livre, leva para o cardápio com a mesa pré-selecionada
      setAbaAtiva('cardapio');
      setMensagem(`🪑 Mesa ${numFormatado} selecionada! Adicione os itens no cardápio.`);
      setTimeout(() => setMensagem(''), 3000);
    }
  };

  const total = carrinho.reduce((acc, item) => acc + item.precoTotalItem, 0);

  const cardapioFiltrado =
    categoriaSel === 'Todas'
      ? cardapio
      : cardapio.filter((i) => i.categoria === categoriaSel);

  // Lista de Mesas para o Painel Visual
  const listaMesas = Array.from({ length: TOTAL_MESAS_SALAO }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    const chave = `Mesa ${num}`;
    const ocupada = Boolean(comandasAgrupadas[chave]);
    return {
      numero: num,
      chave,
      ocupada,
      dados: comandasAgrupadas[chave] || null
    };
  });

  const totalMesasOcupadas = listaMesas.filter((m) => m.ocupada).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-3 md:p-6 pb-24 font-sans">
      {/* Topo do Estabelecimento */}
      <header className="max-w-4xl mx-auto bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-cyan-400 tracking-tight">Era do Gelo 🧊⚡</h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                • SALÃO ABERTO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Painel de Controle, Mesas & Comandas</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap gap-1">
              <button
                onClick={() => setAbaAtiva('salao')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  abaAtiva === 'salao' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                🪑 Salão ({totalMesasOcupadas}/{TOTAL_MESAS_SALAO})
              </button>
              <button
                onClick={() => setAbaAtiva('cardapio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  abaAtiva === 'cardapio' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                📋 Cardápio
              </button>
              <button
                onClick={() => setAbaAtiva('comandas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  abaAtiva === 'comandas' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                💳 Comandas ({Object.keys(comandasAgrupadas).length})
              </button>
              <button
                onClick={() => setAbaAtiva('cozinha')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  abaAtiva === 'cozinha' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                🔥 Cozinha ({pedidos.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {mensagem && (
        <div className="max-w-4xl mx-auto mb-4 p-3 bg-cyan-500/20 border border-cyan-500 text-cyan-300 rounded-xl text-xs font-bold text-center">
          {mensagem}
        </div>
      )}

      {/* ABA 1: PAINEL DE MESAS (ABERTURA DE SALÃO) */}
      {abaAtiva === 'salao' && (
        <main className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 p-4 rounded-xl border border-slate-800 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-100">Mapa Visual do Salão</h2>
              <p className="text-xs text-slate-400">Clique na mesa para abrir atendimento ou gerenciar a conta.</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-emerald-400">Livre ({TOTAL_MESAS_SALAO - totalMesasOcupadas})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-rose-400">Ocupada ({totalMesasOcupadas})</span>
              </div>
            </div>
          </div>

          {/* Grade Visual de Mesas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {listaMesas.map((m) => (
              <button
                key={m.numero}
                onClick={() => selecionarMesaSalao(m.numero)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-32 transition-all transform hover:-translate-y-1 shadow-lg ${
                  m.ocupada
                    ? 'bg-rose-950/40 border-rose-500/50 hover:border-rose-400'
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-500/60'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Mesa
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.ocupada
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {m.ocupada ? '• OCUPADA' : '• LIVRE'}
                  </span>
                </div>

                <div className="my-1">
                  <span className="text-3xl font-black text-slate-100">{m.numero}</span>
                </div>

                {m.ocupada ? (
                  <div className="text-[11px] border-t border-rose-500/20 pt-1.5 truncate">
                    <p className="font-bold text-slate-200 truncate">{m.dados.cliente}</p>
                    <p className="text-rose-400 font-black">R$ {m.dados.totalComanda.toFixed(2)}</p>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-400 font-bold border-t border-slate-800/80 pt-1.5 flex items-center gap-1">
                    <span>+ Abrir Mesa</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </main>
      )}

      {/* CARDÁPIO */}
      {abaAtiva === 'cardapio' && (
        <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-2 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categoriasUnicas.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaSel(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    categoriaSel === cat
                      ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
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
                  className="bg-slate-900 p-4 rounded-xl border border-slate-800/80 flex justify-between items-center gap-4 hover:border-cyan-500/40 transition-all cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-100">{item.nome}</h3>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-medium">
                        {item.categoria}
                      </span>
                    </div>
                    {item.descricao && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.descricao}</p>
                    )}
                    <p className="text-cyan-400 font-extrabold text-sm mt-2">R$ {item.preco.toFixed(2)}</p>
                  </div>
                  <button className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold px-3 py-2 rounded-lg text-xs shrink-0">
                    + Opções
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SACOLA & ATENDIMENTO */}
          <section className="bg-slate-900 p-4 rounded-xl border border-slate-800 h-fit sticky top-4 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 mb-3 pb-2 border-b border-slate-800 flex justify-between items-center">
                <span>Sua Sacola</span>
                <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-0.5 rounded-full">
                  {carrinho.length} itens
                </span>
              </h2>

              {carrinho.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center">Nenhum item selecionado.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {carrinho.map((item, index) => (
                    <div key={index} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/50 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-300">{item.quantidade}x {item.nome}</span>
                        <span className="text-cyan-400">R$ {item.precoTotalItem.toFixed(2)}</span>
                      </div>
                      {item.ponto && <p className="text-[11px] text-cyan-400/90 mt-0.5">📍 {item.ponto}</p>}
                      {item.molhos && item.molhos.length > 0 && (
                        <p className="text-[10px] text-slate-400">🥣 {item.molhos.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FORMULÁRIO */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-400 block border-b border-slate-800 pb-1">
                  Abertura / Lançamento na Mesa
                </span>

                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTipoAtendimento('mesa')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                      tipoAtendimento === 'mesa' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    🪑 Na Mesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoAtendimento('avulso')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                      tipoAtendimento === 'avulso' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    🚶 Avulso / Balcão
                  </button>
                </div>

                {tipoAtendimento === 'mesa' ? (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Número da Mesa: *
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 04"
                      value={numMesa}
                      onChange={(e) => setNumMesa(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-black text-xs p-2 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Identificação / Senha: *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Balcão 01, Senha 12..."
                      value={identificacaoAvulsa}
                      onChange={(e) => setIdentificacaoAvulsa(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-cyan-400 font-black text-xs p-2 rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Celular do Cliente: *
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: 27999998888"
                    value={celularCliente}
                    onChange={handleCelularChange}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 font-semibold text-xs p-2 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Nome do Cliente: *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cliente"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 font-semibold text-xs p-2 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                  {clientesSalvos[celularCliente] && (
                    <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                      ✓ Cliente cadastrado encontrado!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-400">Total:</span>
                <span className="text-cyan-400 text-base">R$ {total.toFixed(2)}</span>
              </div>

              <button
                onClick={enviarPedido}
                disabled={carrinho.length === 0}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/10"
              >
                Lançar Pedido
              </button>
            </div>
          </section>
        </main>
      )}

      {/* PAINEL DE COMANDAS E FECHAMENTO DE MESA */}
      {abaAtiva === 'comandas' && (
        <main className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Controle de Mesas & Comandas Abertas</h2>
          {Object.keys(comandasAgrupadas).length === 0 ? (
            <p className="text-slate-500 text-xs">Nenhuma mesa aberta no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(comandasAgrupadas).map(([local, info]) => (
                <div key={local} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                    <div>
                      <span className="bg-cyan-500 text-slate-950 font-black px-2.5 py-1 rounded text-xs">
                        {local}
                      </span>
                      <span className="text-xs text-slate-300 font-bold ml-2">{info.cliente}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">📞 {info.celular}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-cyan-400 block">
                        R$ {info.totalComanda.toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          setMesaFechamento(info);
                          setQtdPessoas(1);
                        }}
                        className="mt-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 px-2.5 py-1 rounded text-[11px] font-bold transition-all"
                      >
                        📊 Fechar Mesa
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {info.pedidos.map((ped, idx) => (
                      <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800/60 text-xs">
                        <span className="text-[10px] text-slate-500 block mb-1">Hora: {ped.horario}</span>
                        {ped.itens.map((it, i) => (
                          <div key={i} className="flex justify-between text-slate-300">
                            <span>{it.quantidade}x {it.nome}</span>
                            <span className="text-slate-400">R$ {it.precoTotalItem.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* MODAL DE FECHAMENTO E DIVISÃO DE CONTA */}
      {mesaFechamento && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-base text-cyan-400">Fechamento de Conta</h3>
                <p className="text-xs text-slate-400">{mesaFechamento.local} - {mesaFechamento.cliente}</p>
              </div>
              <button
                onClick={() => setMesaFechamento(null)}
                className="text-slate-400 bg-slate-800 w-7 h-7 rounded-full text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Opção de Divisão:</span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => setTipoDivisao('pessoa')}
                  className={`py-1.5 text-xs font-bold rounded-md ${
                    tipoDivisao === 'pessoa' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  👥 Igual por Pessoa
                </button>
                <button
                  onClick={() => setTipoDivisao('item')}
                  className={`py-1.5 text-xs font-bold rounded-md ${
                    tipoDivisao === 'item' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  🍢 Detalhada por Item
                </button>
              </div>
            </div>

            {tipoDivisao === 'pessoa' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-semibold">Dividir por Quantas Pessoas?</label>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                    <button
                      onClick={() => setQtdPessoas((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 text-slate-300 font-bold"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold text-cyan-400">{qtdPessoas}</span>
                    <button
                      onClick={() => setQtdPessoas((q) => q + 1)}
                      className="px-3 py-1 text-slate-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold">Valor por Pessoa:</span>
                  <span className="text-emerald-400 font-black text-base">
                    R$ {(mesaFechamento.totalComanda / qtdPessoas).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {tipoDivisao === 'item' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block mb-1">Resumo do Consumo:</span>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {mesaFechamento.pedidos.flatMap((p) => p.itens).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-300 py-1 border-b border-slate-900">
                      <span>{it.quantidade}x {it.nome}</span>
                      <span className="font-bold text-cyan-400">R$ {it.precoTotalItem.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-sm font-bold text-slate-400">Total da Mesa:</span>
              <span className="text-lg font-black text-cyan-400">
                R$ {mesaFechamento.totalComanda.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => encerarComanda(mesaFechamento.local)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/10"
            >
              🏁 Receber Pagamento e Encerrar Mesa
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO ITEM */}
      {itemSelecionado && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="relative bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-200">Personalizar Item</h3>
                <button
                  onClick={() => setItemSelecionado(null)}
                  className="text-slate-400 hover:text-white bg-slate-800 w-7 h-7 rounded-full text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 border-b border-slate-800">
                <h2 className="text-lg font-black text-white">{itemSelecionado.nome}</h2>
                <p className="text-cyan-400 font-extrabold text-base mt-1">R$ {itemSelecionado.preco.toFixed(2)}</p>
              </div>

              {itemSelecionado.categoria === 'Espetinhos' && (
                <div className="p-4 border-b border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">Ponto da carne:</span>
                  {['Mal passado', 'Ao ponto', 'Bem passado'].map((p) => (
                    <label
                      key={p}
                      onClick={() => setPontoCarne(p)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        pontoCarne === p ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{p}</span>
                      <input type="radio" name="ponto" checked={pontoCarne === p} onChange={() => {}} className="accent-cyan-500" />
                    </label>
                  ))}
                </div>
              )}

              <div className="p-4 border-b border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">Escolha os Molhos:</span>
                {OPCOES_MOLHOS.map((molho) => {
                  const marcado = molhosSelecionados.includes(molho);
                  return (
                    <label
                      key={molho}
                      onClick={() => alternarMolho(molho)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        marcado ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{molho}</span>
                      <input type="checkbox" checked={marcado} onChange={() => {}} className="accent-cyan-500" />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button onClick={() => setQuantidadeModal((q) => Math.max(1, q - 1))} className="w-8 h-8 font-bold text-slate-300">-</button>
                <span className="w-8 text-center text-xs font-bold text-cyan-400">{quantidadeModal}</span>
                <button onClick={() => setQuantidadeModal((q) => q + 1)} className="w-8 h-8 font-bold text-slate-300">+</button>
              </div>

              <button
                onClick={confirmarAdicaoModal}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl text-xs flex justify-between items-center px-4"
              >
                <span>Adicionar</span>
                <span>R$ {(itemSelecionado.preco * quantidadeModal).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAINEL DA COZINHA */}
      {abaAtiva === 'cozinha' && (
        <main className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Painel da Cozinha</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pedidos.map((p) => (
              <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-cyan-500/30">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                  <div>
                    <span className="bg-cyan-500 text-slate-950 font-black px-2 py-0.5 rounded text-xs mr-2">
                      {p.local || `MESA ${p.mesa}`}
                    </span>
                    <span className="text-xs text-slate-200 font-bold">{p.cliente}</span>
                    <span className="text-[10px] text-slate-400 block">📞 {p.celular}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{p.horario}</span>
                </div>
                <ul className="space-y-1.5 text-xs">
                  {p.itens.map((it, idx) => (
                    <li key={idx} className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="font-bold text-slate-200">{it.quantidade}x {it.nome}</div>
                      {it.ponto && <div className="text-cyan-400 text-[10px]">📍 Ponto: {it.ponto}</div>}
                      {it.molhos && it.molhos.length > 0 && <div className="text-emerald-400 text-[10px]">🥣 Molhos: {it.molhos.join(', ')}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}