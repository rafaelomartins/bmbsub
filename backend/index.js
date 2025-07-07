const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');
const { login, registerUser, authenticateToken, getAllUsers, resetUserPassword, deleteUser, updateUserPermissions, getAvailablePermissions } = require('./auth');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  user: 'rafa.oliveira',
  host: 'bi-telco.connector.datalake.bemobi.com',
  database: 'master',
  password: 'Inicio@1',
  port: 5439,
  ssl: { rejectUnauthorized: false }
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Rota para registrar novo usuário (apenas admin)
app.post('/api/auth/register', authenticateToken, async (req, res) => {
  // Verificar se o usuário é admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem registrar usuários' });
  }

  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
  }

  try {
    const newUser = await registerUser(email, password, name, role);
    res.json({ message: 'Usuário registrado com sucesso', user: newUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Rota para buscar todos os usuários (apenas admin)
app.get('/api/auth/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem acessar esta rota' });
  }
  
  try {
    const users = getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para redefinir senha (apenas admin)
app.post('/api/auth/reset-password', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem redefinir senhas' });
  }

  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'ID do usuário e nova senha são obrigatórios' });
  }

  try {
    const updatedUser = await resetUserPassword(userId, newPassword);
    res.json({ message: 'Senha redefinida com sucesso', user: updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para deletar usuário (apenas admin)
app.delete('/api/auth/users/:userId', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem deletar usuários' });
  }

  const { userId } = req.params;

  try {
    const result = deleteUser(userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para atualizar permissões de usuário (apenas admin)
app.put('/api/auth/users/:userId/permissions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem atualizar permissões' });
  }

  const { userId } = req.params;
  const { permissions } = req.body;

  if (!permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ error: 'Permissões devem ser fornecidas como um array' });
  }

  try {
    const updatedUser = updateUserPermissions(userId, permissions);
    res.json({ message: 'Permissões atualizadas com sucesso', user: updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para obter permissões disponíveis (apenas admin)
app.get('/api/auth/permissions', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem acessar esta rota' });
  }

  try {
    const permissions = getAvailablePermissions();
    res.json({ permissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sistema sem autenticação - rotas abertas

app.post('/api/bolepix', async (req, res) => {
  const { correlation_id, application_id, workspace_id, company_id } = req.body;

  if (!correlation_id || !application_id || !workspace_id || !company_id) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  console.log('=== CONSULTA BOLEPIX ===');
  console.log('correlation_id:', correlation_id);
  console.log('application_id:', application_id);
  console.log('workspace_id:', workspace_id);
  console.log('company_id:', company_id);

  const url = `http://bolecode-prd2-payments.systemlake.bemobi.team:8080/v1/payments/${correlation_id}`;
  const headers = {
    'x-application-id': application_id,
    'x-workspace-id': workspace_id,
    'x-company-id': company_id,
  };

  console.log('URL:', url);
  console.log('Headers:', headers);

  const startTime = Date.now();
  console.log('⏳ Iniciando requisição para API externa...');
  
  try {
    
    const response = await axios.get(url, { 
      headers, 
      timeout: 30000, // 30 segundos de timeout
      validateStatus: function (status) {
        return status < 500; // Aceita códigos de erro do cliente (4xx)
      }
    });
    
    const endTime = Date.now();
    console.log(`✅ Sucesso! Status: ${response.status} em ${endTime - startTime}ms`);
    res.json(response.data);
  } catch (error) {
    const endTime = Date.now();
    console.log('=== ERRO NA CONSULTA ===');
    console.log(`❌ Erro após ${endTime - startTime}ms`);
    
    if (error.code === 'ECONNABORTED') {
      console.log('❌ TIMEOUT: A API externa não respondeu em 30 segundos');
      return res.status(504).json({ 
        error: 'Timeout: A API externa não está respondendo. Tente novamente em alguns minutos.',
        details: 'A API de pagamentos pode estar temporariamente indisponível.',
        correlation_id: correlation_id
      });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('❌ CONEXÃO: Não foi possível conectar à API externa');
      return res.status(503).json({ 
        error: 'Serviço indisponível: Não foi possível conectar à API de pagamentos.',
        details: 'O serviço pode estar em manutenção. Tente novamente mais tarde.',
        correlation_id: correlation_id
      });
    }
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers resposta:', error.response.headers);
      
      // Se for erro 404, é provável que o correlation_id não existe
      if (error.response.status === 404) {
        return res.status(404).json({ 
          error: 'Correlation ID não encontrado na base de dados.',
          details: 'Verifique se o Correlation ID está correto.',
          correlation_id: correlation_id
        });
      }
      
      res.status(error.response.status).json({
        error: error.response.data?.error || 'Erro na API externa',
        details: error.response.data,
        correlation_id: correlation_id
      });
    } else {
      console.log('❌ Erro sem resposta:', error.message);
      console.log('❌ Código do erro:', error.code);
      res.status(500).json({ 
        error: 'Erro interno: Falha na comunicação com a API externa.',
        details: error.message,
        correlation_id: correlation_id
      });
    }
  }
});

app.get('/api/correlation/:correlation_id', async (req, res) => {
  const { correlation_id } = req.params;
  try {
    console.log(`\n=== BUSCANDO DADOS PARA: ${correlation_id} ===`);
    
    // Query alterada para usar created_on
    const result = await pool.query(
      'SELECT * FROM refined_payments.payment_management WHERE correlation_id = $1 ORDER BY created_on DESC LIMIT 1',
      [correlation_id]
    );
    
    console.log(`Registros encontrados: ${result.rows.length}`);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Não encontrado' });
    }
    
    console.log('Registro encontrado:', {
      date: result.rows[0].date,
      created_on: result.rows[0].created_on,
      status: result.rows[0].status,
      correlation_id: result.rows[0].correlation_id,
      external_payment_id: result.rows[0].external_payment_id
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro na consulta:', err);
    res.status(500).json({ error: 'Erro ao consultar o banco', details: err.message });
  }
});

// Removendo campos das tabelas no antifraude
const fieldsToRemove = [
  'analysis_id',
  'recurrence_external_id',
  'test_ab',
  'transaction_approved',
  'domain_id',
  'hierarchy',
  'customer_email',
  'risk_score',
  'customer_contract_number',
  'customer_address_city',
  'customer_address_state',
  'context_invoices',
  'context_tags'
];

// Rota de teste para verificar conexão com o banco
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('\n=== TESTE DE CONEXÃO DB ===');
    
    // Teste básico de conexão
    const testResult = await pool.query('SELECT NOW() as current_time');
    console.log('Conexão OK. Hora atual:', testResult.rows[0].current_time);
    
    // Testar se a tabela existe e tem dados
    const tableTest = await pool.query(`
      SELECT COUNT(*) as total 
      FROM refined_service_prevention.dts_grupo_salta 
      LIMIT 1
    `);
    console.log('Tabela dts_grupo_salta - Total de registros:', tableTest.rows[0].total);
    
    // Testar uma consulta com um documento fictício
    const sampleQuery = await pool.query(`
      SELECT customer_document, COUNT(*) as count
      FROM refined_service_prevention.dts_grupo_salta 
      GROUP BY customer_document 
      LIMIT 5
    `);
    console.log('Exemplos de documentos na tabela:', sampleQuery.rows);
    
    res.json({
      connection: 'OK',
      current_time: testResult.rows[0].current_time,
      table_count: tableTest.rows[0].total,
      sample_documents: sampleQuery.rows
    });
  } catch (err) {
    console.error('ERRO NO TESTE DB:', err);
    res.status(500).json({ error: 'Erro ao testar banco', details: err.message });
  }
});

app.post('/api/antifraude', async (req, res) => {
  const { table, document } = req.body;
  console.log('\n=== NOVA REQUISIÇÃO ANTIFRAUDE ===');
  console.log('Body recebido:', req.body);
  console.log('Headers:', req.headers);
  
  if (!table || !document) {
    console.log('❌ Validação falhou: tabela ou documento em branco');
    return res.status(400).json({ error: 'Tabela e documento são obrigatórios.' });
  }

  // Validar tabelas permitidas
  const allowedTables = [
    'dts_7az', 'dts_agenda_edu', 'dts_enel_chile', 'dts_equatorial_cea',
    'dts_equatorial_alagoas', 'dts_equatorial_ceee', 'dts_equatorial_goias',
    'dts_equatorial_maranhao', 'dts_equatorial_para', 'dts_equatorial_piaui',
    'dts_grupo_farias_brito', 'dts_grupo_inspira', 'dts_grupo_salta',
    'dts_grupo_yduqs_sub', 'dts_light', 'dts_neoenergia_bahia',
    'dts_sabesp', 'dts_voltz', 'dts_wave_algar'
  ];
  
  if (!allowedTables.includes(table)) {
    console.log('❌ Tabela não permitida:', table);
    return res.status(400).json({ error: 'Tabela não permitida.' });
  }

  try {
    console.log(`\n=== CONSULTA PREVENÇÃO ===`);
    console.log(`Tabela: ${table}`);
    console.log(`Documento: ${document}`);
    console.log(`Schema completo: refined_service_prevention.${table}`);
    
    const query = `SELECT * FROM refined_service_prevention.${table} WHERE customer_document = $1`;
    console.log('Query SQL:', query);
    console.log('Parâmetros:', [document]);
    
    console.log('⏳ Executando query...');
    const startTime = Date.now();
    const result = await pool.query(query, [document]);
    const endTime = Date.now();
    
    console.log(`✅ Query executada em ${endTime - startTime}ms`);
    console.log(`📊 Registros encontrados: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log('📝 Primeiros campos do primeiro registro:', Object.keys(result.rows[0]).slice(0, 10));
      console.log('📄 Primeiro registro (sample):', {
        customer_document: result.rows[0].customer_document,
        transaction_date: result.rows[0].transaction_date,
        amount: result.rows[0].amount
      });
    } else {
      console.log('⚠️ Nenhum registro encontrado para o documento:', document);
      console.log('💡 Tentando buscar documentos similares...');
      
      // Buscar documentos que começam com os primeiros dígitos
      const similarQuery = `
        SELECT customer_document, COUNT(*) as count
        FROM refined_service_prevention.${table} 
        WHERE customer_document LIKE $1 
        GROUP BY customer_document 
        LIMIT 5
      `;
      const similarResult = await pool.query(similarQuery, [document.substring(0, 3) + '%']);
      console.log('📋 Documentos similares encontrados:', similarResult.rows);
    }
    
    // Remover os campos especificados dos resultados
    const filteredRows = result.rows.map(row => {
      const filteredRow = { ...row };
      fieldsToRemove.forEach(field => {
        if (filteredRow.hasOwnProperty(field)) {
          delete filteredRow[field];
        }
      });
      return filteredRow;
    });
    
    console.log('🎯 Retornando resultados filtrados...');
    res.json(filteredRows);
  } catch (err) {
    console.error('❌ ERRO NA CONSULTA:', err);
    console.error('❌ Stack trace:', err.stack);
    res.status(500).json({ error: 'Erro ao consultar o banco', details: err.message });
  }
});

app.post('/api/pagamentos/gma', async (req, res) => {
  const {
    dtStart,
    dtEnd,
    amount,
    card_bin,
    card_last,
    card_token,
    transaction_id,
    correlation_id,
    application_name,
    card_exp_date,
    nsu,
    authorization_code
  } = req.body;

  try {
    console.log('\n=== CONSULTA PAGAMENTOS GMA ===');
    console.log('Filtros recebidos:', req.body);

    let query = `
      SELECT 
        correlation_id AS correlation_id_GMA,
        transaction_id AS transaction_id_GMA,
        workspace_id AS workspace_id_GMA,
        pos AS pos_GMA,
        "type",
        amount AS Valor_GMA,
        installments AS installments_GMA,
        status AS status_GMA,
        authorization_code AS authorization_code_GMA,
        nsu AS nsu_GMA,
        tokenized AS tokenized_GMA,
        tid AS tid_GMA,
        dt AS data_transacao_GMA,
        card_token AS card_token_GMA,
        card_exp_date AS card_exp_date_GMA
      FROM 
        refined_payments.gma_transactions
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Adicionar filtros dinamicamente
    if (dtStart && dtEnd) {
      // Usar filtros de data simples
      query += ` AND dt >= $${paramIndex}::date AND dt < $${paramIndex + 1}::date + INTERVAL '1 day'`;
      params.push(dtStart, dtEnd);
      paramIndex += 2;
    }

    if (amount) {
      query += ` AND amount = $${paramIndex}`;
      params.push(amount);
      paramIndex++;
    }

    if (card_token) {
      query += ` AND card_token = $${paramIndex}`;
      params.push(card_token);
      paramIndex++;
    }

    if (transaction_id) {
      query += ` AND transaction_id = $${paramIndex}`;
      params.push(transaction_id);
      paramIndex++;
    }

    if (correlation_id) {
      query += ` AND correlation_id = $${paramIndex}`;
      params.push(correlation_id);
      paramIndex++;
    }

    if (card_exp_date) {
      query += ` AND card_exp_date = $${paramIndex}`;
      params.push(card_exp_date);
      paramIndex++;
    }

    if (nsu) {
      query += ` AND nsu = $${paramIndex}`;
      params.push(nsu);
      paramIndex++;
    }

    if (authorization_code) {
      query += ` AND authorization_code = $${paramIndex}`;
      params.push(authorization_code);
      paramIndex++;
    }

    query += ' ORDER BY dt DESC LIMIT 10';

    console.log('Query final:', query);
    console.log('Parâmetros:', params);

    const result = await pool.query(query, params);
    
    console.log(`Registros encontrados: ${result.rows.length}`);
    
    // Se não encontrou nenhum resultado mas há filtros aplicados, tentar uma busca mais ampla
    if (result.rows.length === 0 && params.length > 0) {
      console.log('⚠️ Nenhum resultado encontrado. Tentando busca mais ampla...');
      
      // Buscar registros similares baseados apenas em valor se fornecido
      if (total_amount) {
        const similarQuery = `
          SELECT * FROM refined_ayla_smart.smart_bill_payment_pos_transactions 
          WHERE total_amount BETWEEN $1 - 1000 AND $1 + 1000
          ORDER BY ABS(total_amount - $1) ASC
          LIMIT 10
        `;
        
        const similarResult = await pool.query(similarQuery, [parseFloat(total_amount)]);
        console.log(`Registros similares por valor: ${similarResult.rows.length}`);
        
        if (similarResult.rows.length > 0) {
          return res.json({
            original_results: result.rows,
            similar_results: similarResult.rows,
            message: `Nenhum resultado exato encontrado. Mostrando ${similarResult.rows.length} registros com valores similares a ${total_amount}.`
          });
        }
      }
      
      // Se ainda não encontrou, mostrar alguns registros recentes com dados válidos
      const fallbackQuery = `
        SELECT * FROM refined_ayla_smart.smart_bill_payment_pos_transactions 
        WHERE total_amount IS NOT NULL AND total_amount > 0
        ORDER BY RANDOM()
        LIMIT 5
      `;
      
      const fallbackResult = await pool.query(fallbackQuery);
      console.log(`Registros de exemplo: ${fallbackResult.rows.length}`);
      
      return res.json({
        original_results: result.rows,
        example_results: fallbackResult.rows,
        message: `Nenhum resultado encontrado com os filtros aplicados. Mostrando ${fallbackResult.rows.length} registros de exemplo.`
      });
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error('Erro na consulta GMA:', err);
    res.status(500).json({ error: 'Erro ao consultar o banco', details: err.message });
  }
});

// Rota para testar se há dados nas tabelas
app.get('/api/pagamentos/gma/test', async (req, res) => {
  try {
    console.log('\n=== TESTE DE DADOS GMA ===');
    
    // Teste simples - só verificar se as tabelas existem
    const testQuery = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM refined_payments.gma_transactions LIMIT 1) as gma_count,
        (SELECT COUNT(*) FROM refined_payments.eldorado_card LIMIT 1) as card_count
    `);
    
    console.log('Teste concluído:', testQuery.rows[0]);
    
    res.json({
      status: 'OK',
      message: 'Tabelas GMA acessíveis',
      gma_transactions_exists: testQuery.rows[0].gma_count > 0,
      eldorado_card_exists: testQuery.rows[0].card_count > 0
    });
  } catch (err) {
    console.error('Erro no teste:', err);
    res.status(500).json({ error: 'Erro ao testar', details: err.message });
  }
});

// Rota para listar colunas da tabela GMA (debug)
app.get('/api/pagamentos/gma/columns', async (req, res) => {
  try {
    console.log('\n=== LISTANDO ESQUEMAS DISPONÍVEIS ===');
    
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    
    console.log('Esquemas encontrados:', schemasResult.rows.length);
    
    // Tentar acessar diretamente a tabela com SELECT
    let directQueryResult = null;
    try {
      console.log('Testando acesso direto à tabela...');
      directQueryResult = await pool.query(`
        SELECT COUNT(*) as total
        FROM refined_payments.gma_transactions
        LIMIT 1
      `);
      console.log('Acesso direto funcionou:', directQueryResult.rows[0]);
    } catch (directErr) {
      console.log('Erro no acesso direto:', directErr.message);
    }
    
    res.json({
      available_schemas: schemasResult.rows,
      direct_access_test: directQueryResult ? directQueryResult.rows[0] : null,
      message: 'Lista de esquemas disponíveis'
    });
  } catch (err) {
    console.error('Erro ao listar esquemas:', err);
    res.status(500).json({ error: 'Erro ao listar esquemas', details: err.message });
  }
});

// Rota de teste para verificar dados POS Negado
app.get('/api/pagamentos/posnegado/test', async (req, res) => {
  try {
    console.log('\n=== TESTE DADOS POS NEGADO ===');
    
    // Verificar se a tabela existe e tem dados
    const countQuery = await pool.query(`
      SELECT COUNT(*) as total 
      FROM refined_ayla_smart.smart_bill_payment_pos_transactions 
      LIMIT 1
    `);
    
    console.log('Total de registros:', countQuery.rows[0].total);
    
    // Buscar alguns registros de exemplo
    const sampleQuery = await pool.query(`
      SELECT 
        transaction_date,
        total_amount,
        transaction_bin,
        transaction_pan,
        transaction_nsu,
        transaction_authorization_number
      FROM refined_ayla_smart.smart_bill_payment_pos_transactions 
      WHERE transaction_date IS NOT NULL
      ORDER BY transaction_date DESC 
      LIMIT 5
    `);
    
    // Buscar registros com campos preenchidos
    const filledQuery = await pool.query(`
      SELECT 
        transaction_date,
        total_amount,
        transaction_bin,
        transaction_pan,
        transaction_nsu,
        transaction_authorization_number
      FROM refined_ayla_smart.smart_bill_payment_pos_transactions 
      WHERE (transaction_bin IS NOT NULL AND transaction_bin != '')
         OR (transaction_pan IS NOT NULL AND transaction_pan != '')
         OR (transaction_nsu IS NOT NULL AND transaction_nsu != '')
         OR (transaction_authorization_number IS NOT NULL AND transaction_authorization_number != '')
      LIMIT 5
    `);
    
    console.log('Registros de exemplo:', sampleQuery.rows);
    console.log('Registros com dados preenchidos:', filledQuery.rows);
    
    // Verificar tipos de dados das colunas
    const columnsQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'refined_ayla_smart'
      AND table_name = 'smart_bill_payment_pos_transactions'
      AND column_name IN ('total_amount', 'transaction_bin', 'transaction_pan', 'transaction_nsu', 'transaction_authorization_number', 'transaction_date')
      ORDER BY column_name
    `);
    
    console.log('Estrutura das colunas:', columnsQuery.rows);
    
    res.json({
      total_records: countQuery.rows[0].total,
      sample_data: sampleQuery.rows,
      filled_data: filledQuery.rows,
      column_types: columnsQuery.rows,
      status: 'OK'
    });
  } catch (err) {
    console.error('Erro no teste POS Negado:', err);
    res.status(500).json({ error: 'Erro ao testar POS Negado', details: err.message });
  }
});

app.post('/api/pagamentos/posnegado', async (req, res) => {
  const {
    dtStart,
    dtEnd,
    total_amount,
    transaction_bin,
    transaction_pan,
    transaction_nsu,
    transaction_authorization_number
  } = req.body;

  try {
    console.log('\n=== CONSULTA PAGAMENTOS POS NEGADO ===');
    console.log('Filtros recebidos:', req.body);

    let query = `
      SELECT * FROM refined_ayla_smart.smart_bill_payment_pos_transactions 
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Adicionar filtros dinamicamente com logs detalhados
    if (dtStart && dtEnd) {
      console.log(`Filtro DATA: ${dtStart} até ${dtEnd}`);
      query += ` AND transaction_date >= $${paramIndex}::date AND transaction_date <= $${paramIndex + 1}::date`;
      params.push(dtStart, dtEnd);
      paramIndex += 2;
    }

    if (total_amount) {
      console.log(`Filtro VALOR: ${total_amount} (tipo: ${typeof total_amount})`);
      // Tentar converter para número se for string
      const amount = parseFloat(total_amount);
      if (!isNaN(amount)) {
        query += ` AND total_amount = $${paramIndex}`;
        params.push(amount);
        paramIndex++;
      } else {
        console.log(`⚠️ Valor inválido ignorado: ${total_amount}`);
      }
    }

    if (transaction_bin) {
      console.log(`Filtro BIN: ${transaction_bin}`);
      query += ` AND (transaction_bin = $${paramIndex} OR transaction_bin LIKE $${paramIndex + 1})`;
      params.push(transaction_bin.toString(), `%${transaction_bin}%`);
      paramIndex += 2;
    }

    if (transaction_pan) {
      console.log(`Filtro PAN: ${transaction_pan}`);
      query += ` AND (transaction_pan = $${paramIndex} OR transaction_pan LIKE $${paramIndex + 1})`;
      params.push(transaction_pan.toString(), `%${transaction_pan}%`);
      paramIndex += 2;
    }

    if (transaction_nsu) {
      console.log(`Filtro NSU: ${transaction_nsu} (tipo: ${typeof transaction_nsu})`);
      // Tentar tanto como número quanto como string
      query += ` AND (transaction_nsu::text = $${paramIndex} OR transaction_nsu::text LIKE $${paramIndex + 1})`;
      params.push(transaction_nsu.toString(), `%${transaction_nsu}%`);
      paramIndex += 2;
    }

    if (transaction_authorization_number) {
      console.log(`Filtro AUTH: ${transaction_authorization_number}`);
      query += ` AND (transaction_authorization_number = $${paramIndex} OR transaction_authorization_number LIKE $${paramIndex + 1})`;
      params.push(transaction_authorization_number.toString(), `%${transaction_authorization_number}%`);
      paramIndex += 2;
    }

    query += ' ORDER BY transaction_date DESC LIMIT 10';

    console.log('Query final:', query);
    console.log('Parâmetros:', params);

    const result = await pool.query(query, params);
    
    console.log(`Registros encontrados: ${result.rows.length}`);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Erro na consulta POS Negado:', err);
    res.status(500).json({ error: 'Erro ao consultar o banco', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend rodando na porta ${PORT}`);
}); 