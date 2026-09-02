import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Substitua pela URL exata do seu backend no Render
const BACKEND_URL = "https://era-do-gelo-sistema.onrender.com"; 
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
    fetch(`${BACKEND_URL}/api/cardapio`)
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