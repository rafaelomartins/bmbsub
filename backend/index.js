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

  try {
    const response = await axios.get(url, { headers });
    console.log('Sucesso! Status:', response.status);
    res.json(response.data);
  } catch (error) {
    console.log('=== ERRO NA CONSULTA ===');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers resposta:', error.response.headers);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.log('Erro sem resposta:', error.message);
      res.status(500).json({ error: 'Erro ao consultar a API externa.' });
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
        t.correlation_id AS correlation_id_GMA,
        t.transaction_id AS transaction_id_GMA,
        t.workspace_id AS workspace_id_GMA,
        t.pos AS pos_GMA,
        t."type",
        t.amount AS Valor_GMA,
        t.installments AS installments_GMA,
        t.status AS status_GMA,
        t.authorization_code AS authorization_code_GMA,
        t.nsu AS nsu_GMA,
        t.tokenized AS tokenized_GMA,
        t.tid AS tid_GMA,
        t.dt AS data_transacao_GMA,
        t.card_token AS card_token_GMA,
        t.card_exp_date AS card_exp_date_GMA,
        c.card_created_at,
        c.card_brand_label,
        c.card_bin,
        c.card_last 
      FROM 
        refined_payments.gma_transactions t
      INNER JOIN 
        refined_payments.eldorado_card c ON t.card_token = c.card_extuid 
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Adicionar filtros dinamicamente
    if (dtStart && dtEnd) {
      // Converter para TIMESTAMP para incluir o dia inteiro
      query += ` AND t.dt >= $${paramIndex}::timestamp AND t.dt < $${paramIndex + 1}::timestamp + INTERVAL '1 day'`;
      params.push(dtStart, dtEnd);
      paramIndex += 2;
    }

    if (amount) {
      query += ` AND t.amount = $${paramIndex}`;
      params.push(amount);
      paramIndex++;
    }

    if (card_bin) {
      query += ` AND c.card_bin = $${paramIndex}`;
      params.push(card_bin);
      paramIndex++;
    }

    if (card_last) {
      query += ` AND c.card_last = $${paramIndex}`;
      params.push(card_last);
      paramIndex++;
    }

    if (card_token) {
      query += ` AND t.card_token = $${paramIndex}`;
      params.push(card_token);
      paramIndex++;
    }

    if (transaction_id) {
      query += ` AND t.transaction_id = $${paramIndex}`;
      params.push(transaction_id);
      paramIndex++;
    }

    if (correlation_id) {
      query += ` AND t.correlation_id = $${paramIndex}`;
      params.push(correlation_id);
      paramIndex++;
    }

    if (application_name) {
      query += ` AND t.application_name = $${paramIndex}`;
      params.push(application_name);
      paramIndex++;
    }

    if (card_exp_date) {
      query += ` AND t.card_exp_date = $${paramIndex}`;
      params.push(card_exp_date);
      paramIndex++;
    }

    if (nsu) {
      query += ` AND t.nsu = $${paramIndex}`;
      params.push(nsu);
      paramIndex++;
    }

    if (authorization_code) {
      query += ` AND t.authorization_code = $${paramIndex}`;
      params.push(authorization_code);
      paramIndex++;
    }

    query += ' ORDER BY t.dt DESC LIMIT 10';

    console.log('Query final:', query);
    console.log('Parâmetros:', params);

    const result = await pool.query(query, params);
    
    console.log(`Registros encontrados: ${result.rows.length}`);
    
    // Se não encontrou resultados, fazer uma consulta alternativa sem JOIN
    if (result.rows.length === 0) {
      console.log('Nenhum resultado com JOIN. Tentando consulta alternativa...');
      
      let alternativeQuery = `
        SELECT 
          t.correlation_id AS correlation_id_GMA,
          t.transaction_id AS transaction_id_GMA,
          t.workspace_id AS workspace_id_GMA,
          t.pos AS pos_GMA,
          t."type",
          t.amount AS Valor_GMA,
          t.installments AS installments_GMA,
          t.status AS status_GMA,
          t.authorization_code AS authorization_code_GMA,
          t.nsu AS nsu_GMA,
          t.tokenized AS tokenized_GMA,
          t.tid AS tid_GMA,
          t.dt AS data_transacao_GMA,
          t.card_token AS card_token_GMA,
          t.card_exp_date AS card_exp_date_GMA,
          NULL AS card_created_at,
          NULL AS card_brand_label,
          NULL AS card_bin,
          NULL AS card_last 
        FROM 
          refined_payments.gma_transactions t
        WHERE 1=1
      `;

      const altParams = [];
      let altParamIndex = 1;

      // Adicionar filtros básicos
      if (dtStart && dtEnd) {
        alternativeQuery += ` AND t.dt >= $${altParamIndex}::timestamp AND t.dt < $${altParamIndex + 1}::timestamp + INTERVAL '1 day'`;
        altParams.push(dtStart, dtEnd);
        altParamIndex += 2;
      }

      if (amount) {
        alternativeQuery += ` AND t.amount = $${altParamIndex}`;
        altParams.push(amount);
        altParamIndex++;
      }

      if (card_token) {
        alternativeQuery += ` AND t.card_token = $${altParamIndex}`;
        altParams.push(card_token);
        altParamIndex++;
      }

      if (transaction_id) {
        alternativeQuery += ` AND t.transaction_id = $${altParamIndex}`;
        altParams.push(transaction_id);
        altParamIndex++;
      }

      if (correlation_id) {
        alternativeQuery += ` AND t.correlation_id = $${altParamIndex}`;
        altParams.push(correlation_id);
        altParamIndex++;
      }

      if (nsu) {
        alternativeQuery += ` AND t.nsu = $${altParamIndex}`;
        altParams.push(nsu);
        altParamIndex++;
      }

      if (authorization_code) {
        alternativeQuery += ` AND t.authorization_code = $${altParamIndex}`;
        altParams.push(authorization_code);
        altParamIndex++;
      }

      alternativeQuery += ' ORDER BY t.dt DESC LIMIT 10';

      console.log('Query alternativa:', alternativeQuery);
      console.log('Parâmetros alternativos:', altParams);

      const altResult = await pool.query(alternativeQuery, altParams);
      console.log(`Registros encontrados (alternativa): ${altResult.rows.length}`);
      
      res.json(altResult.rows);
    } else {
      res.json(result.rows);
    }
  } catch (err) {
    console.error('Erro na consulta GMA:', err);
    res.status(500).json({ error: 'Erro ao consultar o banco', details: err.message });
  }
});

// Rota para testar se há dados nas tabelas
app.get('/api/pagamentos/gma/test', async (req, res) => {
  try {
    console.log('\n=== TESTE DE DADOS GMA ===');
    
    // Verificar se há dados na tabela gma_transactions
    const gmaResult = await pool.query('SELECT COUNT(*) as total FROM refined_payments.gma_transactions');
    console.log('Total de registros em gma_transactions:', gmaResult.rows[0].total);
    
    // Verificar se há dados na tabela eldorado_card
    const cardResult = await pool.query('SELECT COUNT(*) as total FROM refined_payments.eldorado_card');
    console.log('Total de registros em eldorado_card:', cardResult.rows[0].total);
    
    // Verificar algumas datas disponíveis
    const datesResult = await pool.query(`
      SELECT MIN(dt) as min_date, MAX(dt) as max_date 
      FROM refined_payments.gma_transactions 
      WHERE dt IS NOT NULL
    `);
    console.log('Datas disponíveis:', datesResult.rows[0]);
    
    // Fazer uma consulta simples sem filtros
    const simpleResult = await pool.query(`
      SELECT 
        t.correlation_id,
        t.transaction_id,
        t.amount,
        t.dt,
        t.card_brand
      FROM refined_payments.gma_transactions t
      LIMIT 5
    `);
    console.log('Exemplo de dados (sem JOIN):', simpleResult.rows);
    
    res.json({
      gma_transactions_count: gmaResult.rows[0].total,
      eldorado_card_count: cardResult.rows[0].total,
      date_range: datesResult.rows[0],
      sample_data: simpleResult.rows
    });
  } catch (err) {
    console.error('Erro no teste:', err);
    res.status(500).json({ error: 'Erro ao testar', details: err.message });
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

    // Adicionar filtros dinamicamente
    if (dtStart && dtEnd) {
      query += ` AND transaction_date >= $${paramIndex} AND transaction_date < $${paramIndex + 1}`;
      params.push(dtStart, dtEnd);
      paramIndex += 2;
    }

    if (total_amount) {
      query += ` AND total_amount = $${paramIndex}`;
      params.push(total_amount);
      paramIndex++;
    }

    if (transaction_bin) {
      query += ` AND transaction_bin = $${paramIndex}`;
      params.push(transaction_bin);
      paramIndex++;
    }

    if (transaction_pan) {
      query += ` AND transaction_pan = $${paramIndex}`;
      params.push(transaction_pan);
      paramIndex++;
    }

    if (transaction_nsu) {
      query += ` AND transaction_nsu = $${paramIndex}`;
      params.push(transaction_nsu);
      paramIndex++;
    }

    if (transaction_authorization_number) {
      query += ` AND transaction_authorization_number = $${paramIndex}`;
      params.push(transaction_authorization_number);
      paramIndex++;
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