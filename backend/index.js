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



// Rota para verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
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
    authorization_code,
    // Campos específicos do POS Negado (caso enviados por engano)
    total_amount,
    transaction_bin,
    transaction_pan,
    transaction_nsu,
    transaction_authorization_number
  } = req.body;

  try {
    console.log('\n=== CONSULTA PAGAMENTOS GMA ===');
    console.log('Filtros recebidos:', req.body);

    // Query base com INNER JOIN
    let query = `
      SELECT TOP 10
        t.correlation_id AS correlation_id_GMA,
        t.transaction_id AS transaction_id_GMA,
        t.workspace_id AS workspace_id_GMA,
        t.pos AS pos_GMA,
        t."type",
        t.amount AS Valor_GMA,
        t.installments AS installments_GMA,
        t.soft_descriptor,
        t.status AS status_GMA,
        t.authorization_code AS authorization_code_GMA,
        t.nsu AS nsu_GMA,
        t.tokenized AS tokenized_GMA,
        t.tid AS tid_GMA,
        t.dt AS data_transacao_GMA,
        t.card_token AS card_token_GMA,
        t.card_brand AS card_brand_GMA,
        t.card_exp_date AS card_exp_date_GMA,
        c.card_created_at,
        c.card_brand_label,
        c.card_bin,
        c.card_last 
      FROM 
        refined_payments.gma_transactions t
      INNER JOIN 
        refined_payments.eldorado_card c ON t.card_token = c.card_extuid 
      WHERE
        t.dt BETWEEN $1::date AND $2::date + INTERVAL '1 day'
    `;
    
    let params = [dtStart, dtEnd];
    let paramIndex = 3;

    // Filtro de valor (opcional)
    if (amount && amount !== '') {
      query += ` AND t.amount = $${paramIndex}::numeric`;
      params.push(amount);
      console.log('Filtro aplicado: amount =', amount);
      paramIndex++;
    }

    // Filtro de card_bin (opcional)
    if (card_bin && card_bin !== '') {
      query += ` AND c.card_bin = $${paramIndex}`;
      params.push(card_bin);
      console.log('Filtro aplicado: card_bin =', card_bin);
      paramIndex++;
    }

    // Filtro de card_last (opcional)
    if (card_last && card_last !== '') {
      query += ` AND c.card_last = $${paramIndex}`;
      params.push(card_last);
      console.log('Filtro aplicado: card_last =', card_last);
      paramIndex++;
    }

    // Filtro de card_exp_date (opcional)
    if (card_exp_date && card_exp_date !== '') {
      query += ` AND t.card_exp_date = $${paramIndex}`;
      params.push(card_exp_date);
      console.log('Filtro aplicado: card_exp_date =', card_exp_date);
      paramIndex++;
    }

    // Filtro de card_token (opcional)
    if (card_token && card_token !== '') {
      query += ` AND t.card_token = $${paramIndex}`;
      params.push(card_token);
      console.log('Filtro aplicado: card_token =', card_token);
      paramIndex++;
    }

    // Filtro de transaction_id (opcional)
    if (transaction_id && transaction_id !== '') {
      query += ` AND t.transaction_id = $${paramIndex}`;
      params.push(transaction_id);
      console.log('Filtro aplicado: transaction_id =', transaction_id);
      paramIndex++;
    }

    // Filtro de correlation_id (opcional)
    if (correlation_id && correlation_id !== '') {
      query += ` AND t.correlation_id = $${paramIndex}`;
      params.push(correlation_id);
      console.log('Filtro aplicado: correlation_id =', correlation_id);
      paramIndex++;
    }

    // Filtro de authorization_code (opcional)
    if (authorization_code && authorization_code !== '') {
      query += ` AND t.authorization_code = $${paramIndex}`;
      params.push(authorization_code);
      console.log('Filtro aplicado: authorization_code =', authorization_code);
      paramIndex++;
    }

    // Filtro de nsu (opcional)
    if (nsu && nsu !== '') {
      query += ` AND t.nsu = $${paramIndex}`;
      params.push(nsu);
      console.log('Filtro aplicado: nsu =', nsu);
      paramIndex++;
    }

    query += ` ORDER BY t.dt DESC`;

    console.log('Query final:', query);
    console.log('Parâmetros:', params);

    const result = await pool.query(query, params);
    
    console.log(`Registros encontrados: ${result.rows.length}`);
    
    // Retornar apenas resultados exatos, sem busca ampla
    res.json(result.rows);
  } catch (err) {
    console.error('Erro na consulta GMA:', err);
    res.status(500).json({ error: 'Erro ao consultar o banco', details: err.message });
  }
});

// Rota específica para testar um correlation_id
app.get('/api/pagamentos/gma/test/:correlation_id', async (req, res) => {
  const { correlation_id } = req.params;
  
  try {
    console.log(`\n=== TESTE ESPECÍFICO CORRELATION_ID: ${correlation_id} ===`);
    
    // Busca exata
    const exactQuery = await pool.query(`
      SELECT COUNT(*) as exact_count
      FROM refined_payments.gma_transactions 
      WHERE correlation_id = $1
    `, [correlation_id]);
    
    // Busca similar
    const similarQuery = await pool.query(`
      SELECT correlation_id, COUNT(*) as occurrences
      FROM refined_payments.gma_transactions 
      WHERE correlation_id LIKE $1
      GROUP BY correlation_id
      LIMIT 10
    `, [`%${correlation_id}%`]);
    
    // Amostra de correlation_ids da tabela
    const sampleQuery = await pool.query(`
      SELECT DISTINCT correlation_id
      FROM refined_payments.gma_transactions 
      WHERE correlation_id IS NOT NULL
      ORDER BY correlation_id
      LIMIT 10
    `);
    
    console.log('Resultado busca exata:', exactQuery.rows[0]);
    console.log('Resultado busca similar:', similarQuery.rows);
    console.log('Amostra de correlation_ids:', sampleQuery.rows);
    
    res.json({
      target_correlation_id: correlation_id,
      exact_matches: exactQuery.rows[0].exact_count,
      similar_matches: similarQuery.rows,
      sample_correlation_ids: sampleQuery.rows,
      status: 'OK'
    });
  } catch (err) {
    console.error('Erro no teste específico:', err);
    res.status(500).json({ error: 'Erro ao testar correlation_id', details: err.message });
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
        query += ` AND total_amount = $${paramIndex}::numeric`;
        params.push(total_amount);
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

// Rota para gerar token da Cielo
app.post('/api/cielo/token', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code é obrigatório' });
  }

  try {
    console.log('=== GERANDO TOKEN CIELO ===');
    console.log('Code recebido:', code.substring(0, 10) + '...');

    // Credenciais corretas da Cielo
    const username = '69d136cb-f7ca-4f4e-850c-e5975d41dba6';
    const password = 'e87a3e8f-6c0e-459f-b8d4-927c3c1c5dc1';
    
    // Encode credentials for Basic Auth
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    // Dados para o token
    const tokenData = {
      grant_type: 'authorization_code',
      code: code
    };

    console.log('Enviando requisição para Cielo...');
    console.log('URL:', 'https://api2.cielo.com.br/consent/v1/oauth/access-token');
    console.log('Body:', tokenData);

    const response = await axios.post(
      'https://api2.cielo.com.br/consent/v1/oauth/access-token',
      tokenData,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Token gerado com sucesso!');
    console.log('Access token recebido:', response.data.access_token?.substring(0, 20) + '...');

    res.json({
      success: true,
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in,
      message: 'Token gerado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao gerar token Cielo:', error.response?.status, error.response?.statusText);
    
    if (error.response?.data) {
      console.error('Detalhes do erro:', error.response.data);
    }

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        'Erro interno do servidor';

    res.status(statusCode).json({
      error: 'Erro ao gerar token da Cielo',
      details: errorMessage,
      status: statusCode
    });
  }
});

// Rota temporária para listar authorization_code disponíveis para um valor/data
app.get('/api/pagamentos/gma/autorizacoes', async (req, res) => {
  const { dtStart, dtEnd, amount } = req.query;
  if (!dtStart || !dtEnd || !amount) {
    return res.status(400).json({ error: 'dtStart, dtEnd e amount são obrigatórios' });
  }
  try {
    const query = `
      SELECT authorization_code, amount, dt
      FROM refined_payments.gma_transactions
      WHERE dt >= $1::date AND dt < $2::date + INTERVAL '1 day' AND amount = $3::numeric
      GROUP BY authorization_code, amount, dt
      ORDER BY dt DESC
      LIMIT 50
    `;
    const params = [dtStart, dtEnd, amount];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar authorization_code', details: err.message });
  }
});

// Rota de teste GET simples
app.get('/api/teste-get', (req, res) => {
  res.json({ ok: true, msg: 'GET funcionando' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend rodando na porta ${PORT}`);
}); 