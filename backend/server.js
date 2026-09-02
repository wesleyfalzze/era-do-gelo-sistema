/**
 * ============================================================================
 * PACOTE 2: GERENCIAMENTO E TESTE DE CONEXÃO COM O BANCO DE DADOS
 * ============================================================================
 */
async function conectarBancoDados() {
  try {
    if (!MONGO_URI || MONGO_URI.includes('xxxxx')) {
      throw new Error("A string MONGO_URI no Render está configurada com o valor genérico 'xxxxx'. Atualize na aba Environment.");
    }
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
    dbConectado = true;
    console.log("🗄️ [SUCESSO] Conectado ao MongoDB Atlas com sucesso!");
  } catch (erro) {
    dbConectado = false;
    console.error("❌ [ERRO] Falha na função conectarBancoDados:", erro.message);
  }
}