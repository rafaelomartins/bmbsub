const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { Pool } = require('pg');
const { login, registerUser, authenticateToken, getAllUsers, resetUserPassword, deleteUser, updateUserPermissions, getAvailablePermissions } = require('../auth');

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do banco PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'rafa.oliveira',
  host: process.env.DB_HOST || 'bi-telco.connector.datalake.bemobi.com',
  database: process.env.DB_NAME || 'master',
  password: process.env.DB_PASSWORD || 'Inicio@1',
  port: process.env.DB_PORT || 5439,
  ssl: { rejectUnauthorized: false }
});

// Todas as rotas existentes aqui...
// (Copiando as rotas principais do arquivo original)

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

// Rota BolePIX
app.post('/api/bolepix', async (req, res) => {
  const { correlation_id, application_id, workspace_id, company_id } = req.body;

  if (!correlation_id || !application_id || !workspace_id || !company_id) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const url = `http://bolecode-prd2-payments.systemlake.bemobi.team:8080/v1/payments/${correlation_id}`;
  const headers = {
    'x-application-id': application_id,
    'x-workspace-id': workspace_id,
    'x-company-id': company_id,
  };

  const startTime = Date.now();
  
  try {
    const response = await axios.get(url, { 
      headers, 
      timeout: 30000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    const endTime = Date.now();
    console.log(`✅ Sucesso! Status: ${response.status} em ${endTime - startTime}ms`);
    res.json(response.data);
  } catch (error) {
    const endTime = Date.now();
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'Timeout: A API externa não está respondendo. Tente novamente em alguns minutos.',
        details: 'A API de pagamentos pode estar temporariamente indisponível.',
        correlation_id: correlation_id
      });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Serviço indisponível: Não foi possível conectar à API de pagamentos.',
        details: 'O serviço pode estar em manutenção. Tente novamente mais tarde.',
        correlation_id: correlation_id
      });
    }
    
    if (error.response) {
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
      res.status(500).json({ 
        error: 'Erro interno: Falha na comunicação com a API externa.',
        details: error.message,
        correlation_id: correlation_id
      });
    }
  }
});

// Rota Antifraude
app.post('/api/antifraude', async (req, res) => {
  const { table, document } = req.body;
  
  if (!table || !document) {
    return res.status(400).json({ error: 'Tabela e documento são obrigatórios.' });
  }

  const allowedTables = [
    'dts_7az', 'dts_agenda_edu', 'dts_enel_chile', 'dts_equatorial_cea',
    'dts_equatorial_alagoas', 'dts_equatorial_ceee', 'dts_equatorial_goias',
    'dts_equatorial_maranhao', 'dts_equatorial_para', 'dts_equatorial_piaui',
    'dts_grupo_farias_brito', 'dts_grupo_inspira', 'dts_grupo_salta',
    'dts_grupo_yduqs_sub', 'dts_light', 'dts_neoenergia_bahia',
    'dts_sabesp', 'dts_voltz', 'dts_wave_algar'
  ];
  
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: 'Tabela não permitida.' });
  }

  try {
    const query = `SELECT * FROM refined_service_prevention.${table} WHERE customer_document = $1`;
    const result = await pool.query(query, [document]);
    
    const fieldsToRemove = [
      'analysis_id', 'recurrence_external_id', 'test_ab', 'transaction_approved',
      'domain_id', 'hierarchy', 'customer_email', 'risk_score',
      'customer_contract_number', 'customer_address_city', 'customer_address_state',
      'context_invoices', 'context_tags'
    ];
    
    const filteredRows = result.rows.map(row => {
      const filteredRow = { ...row };
      fieldsToRemove.forEach(field => {
        if (filteredRow.hasOwnProperty(field)) {
          delete filteredRow[field];
        }
      });
      return filteredRow;
    });
    
    res.json(filteredRows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar o banco', details: err.message });
  }
});

// Exportar para Vercel
module.exports = app; 