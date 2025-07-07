import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import './App.css'
import bemobiLogo from './logobemobi.png'
import Login from './Login'
import UserManagement from './UserManagement'

// Função para formatar valores em reais
const formatCurrency = (value) => {
  if (!value) return 'R$ 0,00';
  
  // Converter para número se for string
  let numValue;
  if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else {
    numValue = value;
  }
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  // IMPORTANTE: O valor já vem em reais da API BolePix (ex: 1187.27)
  // NÃO dividir por 100!
  
  // Formatar como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

function Home() {
  return (
    <div className="home-container">
      <h2>Bem-vindo ao Portal de Consultas Subadquirência Bemobi</h2>
      <p>Selecione uma opção no menu para começar.</p>
    </div>
  );
}

function Antifraude() {
  const [document, setDocument] = useState('');
  const [selectedTable, setSelectedTable] = useState('dts_grupo_salta');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Opções de tabelas disponíveis
  const tableOptions = [
    { value: 'dts_7az', label: 'DTS 7az' },
    { value: 'dts_agenda_edu', label: 'DTS Agenda Edu' },
    { value: 'dts_enel_chile', label: 'DTS Enel Chile' },
    { value: 'dts_equatorial_cea', label: 'DTS Equatorial CEA' },
    { value: 'dts_equatorial_alagoas', label: 'DTS Equatorial Alagoas' },
    { value: 'dts_equatorial_ceee', label: 'DTS Equatorial CEEE' },
    { value: 'dts_equatorial_goias', label: 'DTS Equatorial Goiás' },
    { value: 'dts_equatorial_maranhao', label: 'DTS Equatorial Maranhão' },
    { value: 'dts_equatorial_para', label: 'DTS Equatorial Pará' },
    { value: 'dts_equatorial_piaui', label: 'DTS Equatorial Piauí' },
    { value: 'dts_grupo_farias_brito', label: 'DTS Grupo Farias Brito' },
    { value: 'dts_grupo_inspira', label: 'DTS Grupo Inspira' },
    { value: 'dts_grupo_salta', label: 'DTS Grupo Salta' },
    { value: 'dts_grupo_yduqs_sub', label: 'DTS Grupo YDUQS Sub' },
    { value: 'dts_light', label: 'DTS Light' },
    { value: 'dts_neoenergia_bahia', label: 'DTS Neoenergia Bahia' },
    { value: 'dts_sabesp', label: 'DTS Sabesp' },
    { value: 'dts_voltz', label: 'DTS Voltz' },
    { value: 'dts_wave_algar', label: 'DTS Wave Algar' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setCurrentPage(1);
    try {
      const token = localStorage.getItem('authToken');
              const res = await fetch('/api/antifraude', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ table: selectedTable, document }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro desconhecido');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setDocument('');
    setResult(null);
    setError('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '-';
    
    // Formatação específica para diferentes tipos de dados
    if (key.includes('date') || key.includes('time')) {
      try {
        const date = new Date(value);
        return date.toLocaleString('pt-BR');
      } catch {
        return value;
      }
    }
    
    if (key.includes('amount') || key.includes('value') || key.includes('price')) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return formatCurrency(numValue);
      }
    }
    
    if (typeof value === 'boolean') {
      return value ? '✅ Sim' : '❌ Não';
    }
    
    return String(value);
  };

  const exportToCSV = () => {
    if (!result || result.length === 0) return;
    
    const headers = Object.keys(result[0]).join(',');
    const rows = result.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `consulta_prevencao_${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrar e paginar dados
  const filteredData = result ? result.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) : [];

  // Ordenar dados
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const comparison = String(aValue).localeCompare(String(bValue));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Paginação
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bolepix-card">
      <div className="prevention-header">
        <h1>🛡️ Consultas de Prevenção</h1>
        <p>Sistema integrado de consultas às bases de dados de prevenção e antifraude</p>
      </div>
      
      <form onSubmit={handleSubmit} className="prevention-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="selectedTable">
              <span className="label-icon">🗂️</span>
              Tabela para Consulta
            </label>
            <select
              id="selectedTable"
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="bolepix-select"
            >
              {tableOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="document">
              <span className="label-icon">📄</span>
              Documento do Cliente
            </label>
            <input
              type="text"
              id="document"
              value={document}
              onChange={e => setDocument(e.target.value)}
              placeholder="Digite o CPF/CNPJ"
              className="prevention-input"
              required
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading || !document}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Consultando...
              </>
            ) : (
              <>
                <span className="btn-icon">🔍</span>
                Consultar
              </>
            )}
          </button>
          
          {result && (
            <button type="button" className="btn-secondary" onClick={handleNewSearch}>
              <span className="btn-icon">🔄</span>
              Nova Consulta
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <div>
            <strong>Erro na consulta:</strong>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {result && Array.isArray(result) && result.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <div className="results-info">
              <h2>📊 Resultados da Consulta</h2>
              <div className="results-stats">
                <span className="stat-item">
                  <strong>{result.length}</strong> registro(s) encontrado(s)
                </span>
                <span className="stat-item">
                  <strong>{filteredData.length}</strong> após filtros
                </span>
                <span className="stat-item">
                  Tabela: <strong>{tableOptions.find(t => t.value === selectedTable)?.label}</strong>
                </span>
              </div>
            </div>
            
            <div className="results-actions">
              <button onClick={exportToCSV} className="btn-export">
                <span className="btn-icon">📥</span>
                Exportar CSV
              </button>
            </div>
          </div>

          <div className="search-filter">
            <div className="search-input-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar nos resultados..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="clear-search"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setSearchTerm('unauthorized')}
                style={{
                  padding: '8px 16px',
                  background: searchTerm === 'unauthorized' ? '#d32f2f' : '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => e.target.style.background = '#d32f2f'}
                onMouseLeave={e => e.target.style.background = searchTerm === 'unauthorized' ? '#d32f2f' : '#f44336'}
              >
                🚫 Apenas Unauthorized
              </button>
              
              <button 
                onClick={() => setSearchTerm('')}
                style={{
                  padding: '8px 16px',
                  background: searchTerm === '' ? '#1976d2' : '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => e.target.style.background = '#1976d2'}
                onMouseLeave={e => e.target.style.background = searchTerm === '' ? '#1976d2' : '#2196f3'}
              >
                📋 Todos os Resultados
              </button>
            </div>
          </div>
          
          <div className="table-container">
            <table className="results-table">
              <thead>
                <tr>
                  {Object.keys(result[0])
                    .filter(col => ![
                      'execution_stats', 'source_table', 'healthy_transaction', 'chargeback', 'chargeback_receipt_date', 'chargeback_payment_date', 'versao_layout_edi',
                      'authenticated_by_3ds', 'card_expired', 'is_fallback', 'fallback_details', 'customer_phone_numbers', 'customer_address_complement',
                      'context_productscustomer_address_state', 'customer_address_street', 'customer_address_zip_code', 'customer_address_number',
                      'customer_address_neighborhood', 'zero_dollar_authorization',
                      'customer_ip_address', 'as_network', 'as_number', 'as_organization', 'city_name', 'latitude', 'longitude', 'accuracy_radius',
                      'country_name', 'recurrent', 'analyzed_by_betrusty', 'el_request_time', 'context_products', 'cycle_id',
                      'analysis_id', 'recurrence_external_id', 'test_ab', 'transaction_approved', 'domain_id', 'hierarchy', 'customer_email', 'risk_score', 'customer_contract_number', 'customer_address_city', 'customer_address_state', 'context_invoices', 'context_tags', 'payment_currency'
                    ].includes(col))
                    .map(col => {
                      // Mapeamento dos nomes das colunas
                      const columnNameMap = {
                        'light': 'PARENT ALIAS',
                        'light_web': 'ALIAS',
                        // Adicione outros mapeamentos conforme necessário
                      };
                      
                      const displayName = columnNameMap[col] || col.replace(/_/g, ' ').toUpperCase();
                      
                      return (
                        <th key={col} onClick={() => handleSort(col)} className="sortable-header">
                          <div className="header-content">
                            <span>{displayName}</span>
                            {sortField === col && (
                              <span className="sort-indicator">
                                {sortDirection === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
                  <tr key={i}>
                    {Object.entries(row)
                      .filter(([col]) => ![
                        'execution_stats', 'source_table', 'healthy_transaction', 'chargeback', 'chargeback_receipt_date', 'chargeback_payment_date', 'versao_layout_edi',
                        'authenticated_by_3ds', 'card_expired', 'is_fallback', 'fallback_details', 'customer_phone_numbers', 'customer_address_complement',
                        'context_productscustomer_address_state', 'customer_address_street', 'customer_address_zip_code', 'customer_address_number',
                        'customer_address_neighborhood', 'zero_dollar_authorization',
                        'customer_ip_address', 'as_network', 'as_number', 'as_organization', 'city_name', 'latitude', 'longitude', 'accuracy_radius',
                        'country_name', 'recurrent', 'analyzed_by_betrusty', 'el_request_time', 'context_products', 'cycle_id',
                        'analysis_id', 'recurrence_external_id', 'test_ab', 'transaction_approved', 'domain_id', 'hierarchy', 'customer_email', 'risk_score', 'customer_contract_number', 'customer_address_city', 'customer_address_state', 'context_invoices', 'context_tags', 'payment_currency'
                      ].includes(col))
                      .map(([key, val], j) => (
                        <td key={j} className={`cell-${key}`}>
                          {formatValue(val, key)}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ⏮️
              </button>
              <button 
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ⏪
              </button>
              
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                ⏩
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                ⏭️
              </button>
            </div>
          )}
        </div>
      )}
      
      {result && Array.isArray(result) && result.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>Nenhum resultado encontrado</h3>
          <p>Não foram encontrados registros para o documento <strong>{document}</strong> na tabela selecionada.</p>
          <button onClick={handleNewSearch} className="btn-secondary">
            <span className="btn-icon">🔄</span>
            Tentar Nova Consulta
          </button>
        </div>
      )}
    </div>
  );
}

function BolepixAE() {
  const [form, setForm] = useState({
    correlation_id: '',
    application_id: '',
    workspace_id: '',
    company_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      
      if (name === 'correlation_id') {
        if (value.length === 36) {
          // Se correlation_id foi alterado e tem 36 caracteres, faz a busca automática
          console.log('🚀 Iniciando busca automática para:', value);
          setTimeout(() => handleCorrelationAutoFetch(value, updated), 100);
        } else {
          // Limpa os campos se correlation_id for alterado para menos de 36 caracteres
          updated.application_id = '';
          updated.workspace_id = '';
          updated.company_id = '';
        }
      }
      return updated;
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('authToken');
              const res = await fetch('/api/bolepix', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro desconhecido');
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrelationAutoFetch = async (correlationId, updatedForm) => {
    try {
      console.log('🔍 Buscando dados para correlation_id:', correlationId);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/correlation/${correlationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Dados encontrados:', data);
        
        const newForm = {
          ...updatedForm,
          company_id: data.company_id || '',
          application_id: data.application_id || '',
          workspace_id: data.workspace_id || '',
        };
        
        console.log('📝 Atualizando formulário com:', newForm);
        setForm(newForm);
      } else {
        console.log('❌ Erro na resposta:', res.status);
      }
    } catch (err) {
      console.error('❌ Erro na busca:', err);
    }
  };

  const isFieldsFilled = form.application_id && form.workspace_id && form.company_id;
  const isCorrelationComplete = form.correlation_id.length === 36;

  const handleNewSearch = () => {
    setForm({
      correlation_id: '',
      application_id: '',
      workspace_id: '',
      company_id: '',
    });
    setResult(null);
    setError('');
  };

  return (
    <div className="bolepix-card">
      <h1>Consulta BolePix Subadquirência</h1>
      <form onSubmit={handleSubmit} className="bolepix-form">
        <label htmlFor="correlation_id">Correlation ID</label>
        <input
          type="text"
          name="correlation_id"
          id="correlation_id"
          placeholder="Correlation ID"
          value={form.correlation_id}
          onChange={handleChange}
          required
        />
        <label htmlFor="application_id">Application ID</label>
        <input
          type="text"
          name="application_id"
          id="application_id"
          placeholder="Application ID"
          value={form.application_id}
          onChange={handleChange}
          readOnly
        />
        <label htmlFor="workspace_id">Workspace ID</label>
        <input
          type="text"
          name="workspace_id"
          id="workspace_id"
          placeholder="Workspace ID"
          value={form.workspace_id}
          onChange={handleChange}
          readOnly
        />
        <label htmlFor="company_id">Company ID</label>
        <input
          type="text"
          name="company_id"
          id="company_id"
          placeholder="Company ID"
          value={form.company_id}
          onChange={handleChange}
          readOnly
        />
        {!isCorrelationComplete && !isFieldsFilled && (
          <span className="bolepix-info">Digite o correlation</span>
        )}
        {isCorrelationComplete && !isFieldsFilled && (
          <span className="bolepix-info">Aguarde enquanto consultamos no banco</span>
        )}
        {isFieldsFilled && (
          <button type="submit" disabled={loading} className="bolepix-btn">
            Consultar
          </button>
        )}
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <>
          <div className="result">
            <h2>Resultado</h2>
            <p><b>Descrição:</b> {result.description}</p>
            <p><b>Valor:</b> {formatCurrency(result.value)}</p>
            <p><b>Status:</b> {result.status}</p>
            <p><b>Data de Emissão:</b> {result.issueDate}</p>
            <p><b>Data de Vencimento:</b> {result.dueDate}</p>
            <p><b>Nosso Número:</b> {result.ourNumber}</p>
            <p><b>Número do Documento:</b> {result.documentNumber}</p>
            <p><b>BarCode:</b> {result.barCodeFormatted}</p>
            {result.boletoUrl && (
              <p><a href={result.boletoUrl} target="_blank" rel="noopener noreferrer">Ver Boleto</a></p>
            )}
            {result.qrcode && result.qrcode.qrCodeBase64 && (
      <div>
                <b>QR Code:</b>
                <br />
                <img className="qrcode" src={`data:image/png;base64,${result.qrcode.qrCodeBase64}`} alt="QR Code" style={{maxWidth: 200}} />
                <br />
                <small>{result.qrcode.copyAndPaste}</small>
              </div>
            )}
          </div>
          <button type="button" className="new-search-btn" onClick={handleNewSearch} style={{marginTop: 20}}>
            Fazer nova consulta
          </button>
        </>
      )}
    </div>
  )
}

// --- Componentes Cielo ---
function CieloGerarToken() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Função para extrair CODE da URL atual
  const extractCodeFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromURL = urlParams.get('code');
    if (codeFromURL) {
      setCode(codeFromURL);
      // Limpar a URL após extrair o code
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    return false;
  };

  // Verificar se há CODE na URL quando o componente carrega
  useEffect(() => {
    extractCodeFromURL();
  }, []);

  // Função para colar CODE da área de transferência
  const pasteCodeFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText.length > 10) { // CODEs geralmente são longos
        setCode(clipboardText);
      } else {
        alert('Nenhum texto válido encontrado na área de transferência. Certifique-se de ter copiado o CODE da URL da Cielo.');
      }
    } catch (err) {
      alert('Não foi possível acessar a área de transferência. Cole o CODE manualmente no campo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAccessToken('');
    setCopied(false);
    try {
      const res = await fetch('https://api2.cielo.com.br/consent/v1/oauth/access-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('69d136cb-f7ca-4f4e-850c-e5975d41dba6:e87a3e8f-6c0e-459f-b8d4-927c3c1c5dc1'),
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error_description || err.error || 'Erro desconhecido');
      }
      const data = await res.json();
      setAccessToken(data.access_token || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para copiar o token para a área de transferência
  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(accessToken);
      setCopied(true);
      // Resetar o estado após 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = accessToken;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bolepix-card">
      <h1>Gerar Token - Cielo</h1>
      
      {/* Seção de Acesso OAuth */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>🔐 Obter CODE da Cielo</h3>
        <div style={{ margin: '0 0 15px 0', color: '#424242', fontSize: '0.95rem' }}>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>Passo a passo:</strong>
          </p>
          <ol style={{ margin: '0 0 10px 0', paddingLeft: '20px' }}>
            <li>Clique em "🌐 Abrir Cielo OAuth"</li>
            <li>Faça login na sua conta Cielo</li>
            <li>Selecione a empresa desejada</li>
            <li>Você será redirecionado para uma URL como: <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>https://www.cielo.com.br?code=ABC123...</code></li>
            <li>Copie o valor do parâmetro <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>code=</code> da URL</li>
            <li>Volte para esta página e clique em "📋 Colar CODE" ou cole manualmente no campo</li>
          </ol>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <button 
            onClick={() => window.open('https://minhaconta2.cielo.com.br/oauth/?mode=redirect&client_id=69d136cb-f7ca-4f4e-850c-e5975d41dba6&redirect_uri=https:%2F%2Fwww.cielo.com.br&state=123456&scope=transaction_read,transaction_write', '_blank')}
            style={{
              marginTop: 18,
              padding: '10px 24px',
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            🌐 Abrir Cielo OAuth
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bolepix-form" style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, marginBottom: 6, display: 'block', textAlign: 'center' }}>CODE</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Cole aqui o CODE"
            required
            maxLength={100}
            style={{
              width: 440,
              maxWidth: '95vw',
              padding: '10px 12px',
              border: '2px solid #1976d2',
              borderRadius: 6,
              fontSize: 16,
              letterSpacing: '0.04em',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
              background: '#fff',
              color: '#333',
              overflowX: 'auto',
              textAlign: 'center'
            }}
            size={44}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={pasteCodeFromClipboard}
            style={{
              background: '#43a047',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 16px',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minWidth: 110
            }}
            onMouseEnter={e => e.target.style.background = '#388e3c'}
            onMouseLeave={e => e.target.style.background = '#43a047'}
          >
            📋 Colar CODE
          </button>
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px 0',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 18,
            cursor: 'pointer'
          }}
        >
          Gerar Token
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {accessToken && (
        <div style={{
          background: '#f5f5f5',
          border: '1px solid #bdbdbd',
          borderRadius: 8,
          padding: 16,
          marginTop: 16
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <b style={{ color: '#1976d2', marginBottom: 4 }}>Access Token:</b>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' }}>
              <input
                type="text"
                value={accessToken}
                readOnly
                style={{
                  width: 440,
                  maxWidth: '95vw',
                  padding: '10px 12px',
                  border: '1.5px solid #1976d2',
                  borderRadius: 6,
                  fontSize: 15,
                  background: '#e3f2fd',
                  color: '#333',
                  fontFamily: 'monospace',
                  textAlign: 'center'
                }}
              />
              <button
                onClick={handleCopyToken}
                style={{
                  background: copied ? '#43a047' : '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  minWidth: 110
                }}
              >
                {copied ? '✅ Copiado!' : '📋 Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CieloSolicitarCancelamento() {
  const [token, setToken] = useState('');
  const [merchantID, setMerchantID] = useState('');
  const [nsu, setNsu] = useState('');
  const [cardNumberLast4Digits, setCardNumberLast4Digits] = useState('');
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [value, setValue] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [bodyEnviado, setBodyEnviado] = useState(null);
  
  // Estados para geração de token
  const [code, setCode] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Função para formatar entrada de valor
  const handleValueChange = (e) => {
    let inputValue = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    setValue(inputValue); // Armazena o valor em centavos (ex: 320 para R$ 3,20)
  };

  // Função para formatar data no formato 28-05-2025 13:08:00
  const formatDateForAPI = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Retorna o valor original se não for uma data válida
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateString; // Retorna o valor original em caso de erro
    }
  };

  // Função para gerar token
  const handleGenerateToken = async (e) => {
    e.preventDefault();
    setTokenLoading(true);
    setTokenError('');
    try {
      const res = await fetch('https://api2.cielo.com.br/consent/v1/oauth/access-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('69d136cb-f7ca-4f4e-850c-e5975d41dba6:e87a3e8f-6c0e-459f-b8d4-927c3c1c5dc1'),
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error_description || err.error || 'Erro desconhecido');
      }
      const data = await res.json();
      const accessToken = data.access_token || '';
      setToken(accessToken); // Preenche automaticamente o campo token
      setTokenError('');
    } catch (err) {
      setTokenError(err.message);
    } finally {
      setTokenLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Validações
      if (!token.trim()) {
        throw new Error('Token é obrigatório');
      }
      if (!merchantID.trim()) {
        throw new Error('Merchant ID é obrigatório');
      }
      if (!value || Number(value) <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      // Formatar a data antes de enviar
      const formattedDate = formatDateForAPI(transactionDate);

      // Formatar o valor com ponto como separador decimal (ex: 95.00)
      const valueInReais = Number(value) / 100; // Converter centavos para reais
      const formattedValue = valueInReais.toFixed(2); // Formatar com 2 casas decimais e ponto

      const body = {
        transactions: [
          {
            merchantID: merchantID.trim(),
            nsu: Number(nsu),
            cardNumberLast4Digits: cardNumberLast4Digits.trim(),
            authorizationCode: authorizationCode.trim(),
            refundAmount: {
              currency: 'BRL',
              value: formattedValue
            },
            saleAmount: {
              currency: 'BRL',
              value: formattedValue
            },
            transactionDate: formattedDate
          }
        ]
      };
      
      console.log('Body enviado para Cielo:', JSON.stringify(body, null, 2));
      console.log('Token (primeiros 10 caracteres):', token.substring(0, 10) + '...');
      
      setBodyEnviado(body);
      const res = await fetch('https://api2.cielo.com.br/refunds-api/v1/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(body),
      });
      console.log('Status da resposta:', res.status, res.statusText);
      
      if (!res.ok) {
        let errorMessage = `Erro HTTP ${res.status}: ${res.statusText}`;
        try {
          const err = await res.json();
          console.log('Erro da API Cielo:', err);
          errorMessage = err.error_description || err.message || err.error || errorMessage;
        } catch (parseError) {
          console.log('Erro ao fazer parse da resposta de erro:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log('Resposta da API Cielo:', data);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bolepix-card">
      <h1>Solicitar Cancelamento - Cielo</h1>
      
      {/* Seção de Geração de Token */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>🔑 Gerar Token de Acesso</h3>
        <form onSubmit={handleGenerateToken} className="bolepix-form" style={{ margin: 0 }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="cielo-code">CODE da Cielo</label>
              <input
                type="text"
                id="cielo-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Digite o CODE da Cielo"
                required
                style={{ marginBottom: 0 }}
              />
            </div>
            <button 
              type="submit" 
              className="bolepix-btn" 
              disabled={tokenLoading || !code}
              style={{ marginBottom: 0, minWidth: '120px' }}
            >
              {tokenLoading ? 'Gerando...' : 'Gerar Token'}
            </button>
          </div>
        </form>
        {tokenError && <div className="error" style={{ marginTop: '10px' }}>{tokenError}</div>}
        {token && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e8', borderRadius: '6px', border: '1px solid #4caf50' }}>
            <strong style={{ color: '#2e7d32' }}>✅ Token Gerado com Sucesso!</strong>
            <div style={{ wordBreak: 'break-all', marginTop: '5px', color: '#1976d2', fontSize: '0.9rem' }}>
              {token.substring(0, 20)}...
            </div>
          </div>
        )}
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="bolepix-form">
        <label htmlFor="token">Token</label>
        <input
          type="text"
          id="token"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Token será preenchido automaticamente após gerar"
          required
          readOnly
          style={{ background: token ? '#f0f8ff' : '#f5f5f5', cursor: 'not-allowed' }}
        />
        <label htmlFor="merchantID">Merchant ID</label>
        <input
          type="text"
          id="merchantID"
          value={merchantID}
          onChange={e => setMerchantID(e.target.value)}
          placeholder="Merchant ID"
          required
        />
        <label htmlFor="nsu">NSU</label>
        <input
          type="number"
          id="nsu"
          value={nsu}
          onChange={e => setNsu(e.target.value)}
          placeholder="NSU"
          required
        />
        <label htmlFor="cardNumberLast4Digits">Últimos 4 dígitos do cartão</label>
        <input
          type="text"
          id="cardNumberLast4Digits"
          value={cardNumberLast4Digits}
          onChange={e => setCardNumberLast4Digits(e.target.value)}
          placeholder="Ex: 4601"
          required
        />
        <label htmlFor="authorizationCode">Código de Autorização</label>
        <input
          type="text"
          id="authorizationCode"
          value={authorizationCode}
          onChange={e => setAuthorizationCode(e.target.value)}
          placeholder="Código de Autorização"
          required
        />
        <label htmlFor="value">Valor (R$)</label>
        <input
          type="text"
          id="value"
          value={value ? formatCurrency(value) : ''}
          onChange={handleValueChange}
          placeholder="0,00"
          required
        />
        <label htmlFor="transactionDate">Data da Transação</label>
        <input
          type="datetime-local"
          id="transactionDate"
          value={transactionDate}
          onChange={e => setTransactionDate(e.target.value)}
          required
        />
        <button type="submit" className="bolepix-btn" disabled={loading || !token || !merchantID || !nsu || !cardNumberLast4Digits || !authorizationCode || !value || !transactionDate}>
          {loading ? 'Enviando...' : 'Confirmar'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <b>Body enviado:</b>
          <pre style={{textAlign:'left',background:'#f5f5f5',padding:'10px',borderRadius:'6px',marginTop:'10px',overflowX:'auto'}}>{JSON.stringify(bodyEnviado, null, 2)}</pre>
          <b>Resposta da API:</b>
          <pre style={{textAlign:'left',background:'#f5f5f5',padding:'10px',borderRadius:'6px',marginTop:'10px',overflowX:'auto'}}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function CieloCartaCancelamento() {
  const [token, setToken] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [cancellationId, setCancellationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  function tratarMerchantId(valor) {
    // Remove ponto e tudo após o E (inclusive E9), pega só os números antes do E
    let num = valor.toString().replace(/\./g, '');
    num = num.split('E')[0]; // Remove E e tudo após
    // Preenche com zeros à direita até 10 caracteres
    while (num.length < 10) num += '0';
    return num.slice(0, 10);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPdfUrl('');
    try {
      const merchantIdTratado = tratarMerchantId(merchantId);
      const res = await fetch('https://api2.cielo.com.br/refunds-api/v1/letter-api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          merchantId: merchantIdTratado,
          cancellationId: cancellationId,
          language: 'PT_BR',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error_description || err.error || 'Erro desconhecido');
      }
      // Espera-se que a resposta seja um PDF (blob)
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bolepix-card">
      <h1>Carta de Cancelamento - Cielo</h1>
      <form onSubmit={handleSubmit} className="bolepix-form">
        <label htmlFor="token">Token</label>
        <input
          type="text"
          id="token"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Token de autenticação (Bearer)"
          required
        />
        <label htmlFor="merchantId">Merchant ID</label>
        <input
          type="text"
          id="merchantId"
          value={merchantId}
          onChange={e => setMerchantId(e.target.value)}
          placeholder="Merchant ID"
          required
        />
        <label htmlFor="cancellationId">Cancellation ID</label>
        <input
          type="text"
          id="cancellationId"
          value={cancellationId}
          onChange={e => setCancellationId(e.target.value)}
          placeholder="Cancellation ID"
          required
        />
        <button type="submit" className="bolepix-btn" disabled={loading || !token || !merchantId || !cancellationId}>
          {loading ? 'Enviando...' : 'Confirmar'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {pdfUrl && (
        <div className="result">
          <b>Carta de Cancelamento gerada!</b><br />
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download="carta-cancelamento.pdf">Baixar PDF</a>
        </div>
      )}
      </div>
  );
}

function CieloCancelamentoPM() {
  const [correlationId, setCorrelationId] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [date, setDate] = useState('');
  const [amountValue, setAmountValue] = useState('');
  const [status, setStatus] = useState('');
  const [statusLabel, setStatusLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [result, setResult] = useState(null);

  // Busca automática ao digitar correlationId
  useEffect(() => {
    if (correlationId.length === 36) {
      setBuscando(true);
      setError('');
      setResult(null);
                  fetch(`/api/correlation/${correlationId}`)
        .then(res => res.ok ? res.json() : Promise.reject('Não encontrado'))
        .then(data => {
          console.log('Todos os dados recebidos do backend:', data);
          console.log('Chaves disponíveis:', Object.keys(data));
          console.log('amount_value:', data.amount_value);
          console.log('date:', data.date);
          console.log('payment_type:', data.payment_type);
          console.log('status ORIGINAL:', data.status);
          console.log('status_history:', data.status_history);
          console.log('status TIPO:', typeof data.status);
          console.log('status É ARRAY?', Array.isArray(data.status));
          
          setApplicationId(data.application_id || '');
          setWorkspaceId(data.workspace_id || '');
          setCompanyId(data.company_id || '');
          setPaymentType(data.payment_type || '');
          setAmountValue(data.amount_value || '');
          setDate(data.date || '');
          
          // Status - usar status_history se disponível, senão usar status simples
          let statusParaProcessar = data.status_history || [data.status];
          console.log('statusParaProcessar:', statusParaProcessar);
          
          // Ordem hierárquica dos status (do menor para o maior)
          const statusOrder = ['CAPTURED', 'AUTHORIZED', 'REFUNDING', 'REFUND'];
          console.log('Ordem hierárquica:', statusOrder);
          
          // Encontrar o status de MAIOR hierarquia presente (não o primeiro, mas o de maior índice)
          let ultimoStatus = '';
          let maiorIndice = -1;
          
          // Se for array, processar todos
          if (Array.isArray(statusParaProcessar)) {
            console.log('Processando array de status...');
            statusParaProcessar.forEach((status, index) => {
              if (status) { // Ignorar nulls/undefined
                const indice = statusOrder.indexOf(status);
                console.log(`Posição ${index}: Status "${status}" tem índice hierárquico ${indice}`);
                if (indice !== -1 && indice > maiorIndice) {
                  maiorIndice = indice;
                  ultimoStatus = status;
                  console.log(`🔄 Novo status de maior hierarquia: "${ultimoStatus}" (índice ${indice})`);
                }
              }
            });
            console.log(`✅ Status final escolhido: "${ultimoStatus}" (maior hierarquia: ${maiorIndice})`);
          } else {
            // Se for string simples
            console.log('Status é STRING simples:', statusParaProcessar);
            ultimoStatus = statusParaProcessar || '';
          }
          
          console.log('statusValue FINAL:', ultimoStatus);
          setStatus(ultimoStatus);
          
          // Mapear status para labels
          const statusMapping = {
            'CAPTURED': 'Capturado',
            'AUTHORIZED': 'Autorizado', 
            'REFUNDING': 'Estorno solicitado',
            'REFUND': 'Estornado'
          };
          const labelFinal = statusMapping[ultimoStatus] || ultimoStatus || '';
          console.log('Label FINAL:', labelFinal);
          setStatusLabel(labelFinal);
        })
        .catch(() => {
          setApplicationId('');
          setWorkspaceId('');
          setCompanyId('');
          setPaymentType('');
          setAmountValue('');
          setDate('');
          setStatus('');
          setStatusLabel('');
          setError('Não encontrado');
        })
        .finally(() => setBuscando(false));
    } else {
      setApplicationId('');
      setWorkspaceId('');
      setCompanyId('');
      setPaymentType('');
      setAmountValue('');
      setDate('');
      setStatus('');
      setStatusLabel('');
      setResult(null);
    }
  }, [correlationId]);

  const handleCancelamento = async (retryCount = 0) => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      console.log(`Tentativa ${retryCount + 1} de cancelamento para correlation_id: ${correlationId}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(`http://api.payment-management.prd.izzie.m4u.team/v2/payments/${correlationId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId,
          'x-application-id': applicationId,
          'x-company-id': companyId,
          'x-correlation-id': correlationId,
          'x-environment': 'PRD'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      console.log('Cancelamento realizado com sucesso:', data);
      
    } catch (err) {
      console.error('Erro no cancelamento:', err);
      
      // Verifica se é um erro de rede que pode ser retentado
      const isNetworkError = err.name === 'AbortError' || 
                            err.message.includes('ERR_NETWORK_CHANGED') ||
                            err.message.includes('fetch') ||
                            err.message.includes('NetworkError') ||
                            err.message.includes('Failed to fetch');
      
      if (isNetworkError && retryCount < 2) {
        console.log(`Erro de rede detectado. Tentando novamente em 2 segundos... (tentativa ${retryCount + 2}/3)`);
        setError(`Erro de conexão. Tentando novamente... (${retryCount + 2}/3)`);
        
        setTimeout(() => {
          handleCancelamento(retryCount + 1);
        }, 2000);
        return;
      }
      
      // Mensagens de erro mais amigáveis
      let errorMessage = err.message;
      if (err.name === 'AbortError') {
        errorMessage = 'Timeout: A requisição demorou muito para responder. Tente novamente.';
      } else if (isNetworkError) {
        errorMessage = 'Erro de conexão de rede. Verifique sua internet e tente novamente.';
      }
      
      setError(errorMessage);
      setLoading(false);
    } finally {
      if (retryCount === 0) {
        setLoading(false);
      }
    }
  };

  const isDataLoaded = applicationId && workspaceId && companyId;

  return (
    <div className="bolepix-card">
      <h1>Cancelamento PM - Cielo</h1>
      <form className="bolepix-form">
        <label htmlFor="correlationId">Correlation ID</label>
        <input
          type="text"
          id="correlationId"
          value={correlationId}
          onChange={e => setCorrelationId(e.target.value)}
          placeholder="Correlation ID"
          required
        />
        
        <label>Company ID</label>
        <input type="text" value={companyId} readOnly />
        
        <label>Application ID</label>
        <input type="text" value={applicationId} readOnly />
        
        <label>Workspace ID</label>
        <input type="text" value={workspaceId} readOnly />
        
        <label>Tipo de Pagamento</label>
        <input type="text" value={paymentType} readOnly />
        
        <label>Data</label>
        <input type="text" value={date} readOnly />
        
        <label>Valor</label>
        <input type="text" value={formatCurrency(amountValue)} readOnly />
        
        <label>Status</label>
        <input type="text" value={statusLabel} readOnly />
        
        {buscando && <div className="bolepix-info">Buscando dados...</div>}
        
        {applicationId && workspaceId && companyId && (
          <button 
            type="button" 
            onClick={handleCancelamento}
            disabled={loading || status !== 'AUTHORIZED'}
            className="bolepix-button"
            style={{
              opacity: status !== 'AUTHORIZED' ? 0.5 : 1,
              cursor: status !== 'AUTHORIZED' ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processando cancelamento...' : 'Confirmar Cancelamento'}
          </button>
        )}
        
        {status && status !== 'AUTHORIZED' && (
          <div className="bolepix-info" style={{color: '#ff9800', marginTop: '10px'}}>
            ⚠️ Cancelamento só é permitido para pagamentos com status "Autorizado"
          </div>
        )}
      </form>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="result">
          <h2>Resultado do Cancelamento</h2>
          <pre style={{textAlign:'left',background:'#f5f5f5',padding:'10px',borderRadius:'6px',marginTop:'10px',overflowX:'auto'}}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function Pagamentos({ submenu }) {
  // Apenas para o submenu GMA
  const [filters, setFilters] = useState({
    dtStart: '',
    dtEnd: '',
    amount: '',
    card_bin: '',
    card_last: '',
    card_token: '',
    transaction_id: '',
    correlation_id: '',
    application_name: '',
    card_exp_date: '',
    nsu: '',
    authorization_code: '',
    // Campos específicos do POS Negado
    total_amount: '',
    transaction_bin: '',
    transaction_pan: '',
    transaction_nsu: '',
    transaction_authorization_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '-';
    
    // Formatação específica para diferentes tipos de dados
    if (key.toLowerCase().includes('data') || key.toLowerCase().includes('date')) {
      try {
        const date = new Date(value);
        return date.toLocaleString('pt-BR');
      } catch {
        return value;
      }
    }
    
    if (key.toLowerCase().includes('valor') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('value')) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return formatCurrency(numValue);
      }
    }
    
    if (typeof value === 'boolean') {
      return value ? '✅ Sim' : '❌ Não';
    }
    
    return String(value);
  };

  const getSortValue = (value, key) => {
    // Para ordenação, usar valores numéricos quando possível
    if (key.toLowerCase().includes('valor') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('value')) {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? 0 : numValue;
    }
    
    if (key.toLowerCase().includes('data') || key.toLowerCase().includes('date')) {
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 0 : date.getTime();
      } catch {
        return 0;
      }
    }
    
    return String(value).toLowerCase();
  };

  const sortedResults = [...results].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = getSortValue(a[sortField], sortField);
    const bValue = getSortValue(b[sortField], sortField);
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const comparison = String(aValue).localeCompare(String(bValue));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Filtrar resultados por termo de pesquisa
  const filteredResults = searchTerm 
    ? sortedResults.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : sortedResults;

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    
    try {
      const endpoint = submenu === 'gma' ? '/api/pagamentos/gma' : '/api/pagamentos/posnegado';
      const token = localStorage.getItem('authToken');
              const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na consulta');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Erro ao buscar pagamentos.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (submenu !== 'gma') {
    return (
      <div className="bolepix-card">
        <h1 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 24 }}>Pagamentos - Pagamento POS Negado</h1>
        
        {/* Formulário de Filtros */}
        <form onSubmit={handleSubmit} style={{ background: '#f7f7f7', borderRadius: 12, padding: 32, marginBottom: 32, boxShadow: '0 2px 12px rgba(25,118,210,0.06)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            marginBottom: 24
          }}>
            <div>
              <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Data Inicial</label>
              <div style={{ position: 'relative' }}>
                <input type="date" name="dtStart" value={filters.dtStart} onChange={handleChange} style={dateInputStyle} />
                <span style={calendarIconStyle}>📅</span>
              </div>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Data Final</label>
              <div style={{ position: 'relative' }}>
                <input type="date" name="dtEnd" value={filters.dtEnd} onChange={handleChange} style={dateInputStyle} />
                <span style={calendarIconStyle}>📅</span>
              </div>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Valor Total</label>
              <input type="number" name="total_amount" value={filters.total_amount} onChange={handleChange} placeholder="Ex: 41056" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>BIN (6 dígitos)</label>
              <input type="text" name="transaction_bin" value={filters.transaction_bin} onChange={handleChange} maxLength={6} placeholder="6 dígitos" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>PAN (4 últimos)</label>
              <input type="text" name="transaction_pan" value={filters.transaction_pan} onChange={handleChange} maxLength={4} placeholder="4 dígitos" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>NSU</label>
              <input type="text" name="transaction_nsu" value={filters.transaction_nsu} onChange={handleChange} placeholder="NSU" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Número de Autorização</label>
              <input type="text" name="transaction_authorization_number" value={filters.transaction_authorization_number} onChange={handleChange} placeholder="Authorization Number" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="submit" style={{ padding: '14px 48px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(25,118,210,0.10)' }} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>
        
        {error && <div className="error">{error}</div>}
        {results.length > 0 ? (
          <div style={{ 
            overflowX: 'auto', 
            marginTop: 24,
            maxWidth: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            boxShadow: '0 2px 12px rgba(25,118,210,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 16px', marginTop: 16 }}>
              <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 16 }}>
                Exibindo <b>{filteredResults.length}</b> registro(s)
                {sortField && (
                  <span style={{ fontSize: 14, color: '#666', marginLeft: 8 }}>
                    • Ordenado por: <b>{sortField.replace(/_/g, ' ').toUpperCase()}</b> ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                  </span>
                )}
              </span>
            </div>
            
            {/* Campo de pesquisa */}
            <div style={{ 
              padding: '0 16px 16px 16px',
              borderBottom: '1px solid #e0e0e0',
              marginBottom: 16
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8f9fa',
                borderRadius: 8,
                padding: '8px 12px',
                border: '1px solid #e0e0e0'
              }}>
                <span style={{ marginRight: 8, fontSize: 16 }}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar nos resultados..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 14,
                    width: '100%',
                    color: '#333'
                  }}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: '#666',
                      padding: '4px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Limpar busca"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            <table className="results-table" style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              background: '#fff', 
              minWidth: 1200,
              margin: 0
            }}>
              <thead>
                <tr>
                  {Object.keys(results[0]).map(key => (
                    <th
                      key={key}
                      title={key}
                      onClick={() => handleSort(key)}
                      style={{
                        padding: 12,
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        color: '#fff',
                        border: '1px solid #e0e0e0',
                        fontSize: 15,
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        maxWidth: 180,
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        textAlign: 'center',
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                        <span title={key}>{key.replace(/_/g, ' ').toUpperCase()}</span>
                        <span style={{ 
                          fontSize: 18, 
                          fontWeight: 'bold',
                          color: sortField === key ? '#ffffff' : '#e3f2fd',
                          background: sortField === key ? '#1976d2' : 'rgba(25,118,210,0.3)',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 6,
                          border: sortField === key ? '2px solid #ffffff' : '1px solid rgba(25,118,210,0.5)',
                          boxShadow: sortField === key ? '0 2px 8px rgba(25,118,210,0.4)' : '0 1px 3px rgba(25,118,210,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}>
                          {sortField === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? '#f7fafd' : '#fff',
                      transition: 'background 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#e3f0fc')}
                    onMouseOut={e => (e.currentTarget.style.background = i % 2 === 0 ? '#f7fafd' : '#fff')}
                  >
                    {Object.entries(row).map(([key, val], j) => {
                      // Formatação de valores
                      let displayVal = formatValue(val, key);
                      // Truncar textos longos
                      const isLong = typeof displayVal === 'string' && displayVal.length > 32;
                      return (
                        <td
                          key={j}
                          title={isLong ? displayVal : undefined}
                          style={{
                            padding: 12,
                            border: '1px solid #e0e0e0',
                            fontSize: 14,
                            maxWidth: 180,
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            overflow: 'hidden',
                            textAlign: 'center',
                            background: 'inherit',
                            verticalAlign: 'top',
                            lineHeight: '1.4'
                          }}
                        >
                          {isLong ? displayVal.slice(0, 30) + '…' : displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && <div style={{ textAlign: 'center', color: '#bdbdbd', marginTop: 32, fontSize: 18 }}>Nenhum resultado encontrado.</div>
        )}
      </div>
    );
  }

  return (
    <div className="bolepix-card">
      <h1 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 24 }}>Pagamentos - Web / PIX (GMA)</h1>
      <form onSubmit={handleSubmit} style={{ background: '#f7f7f7', borderRadius: 12, padding: 32, marginBottom: 32, boxShadow: '0 2px 12px rgba(25,118,210,0.06)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          marginBottom: 24
        }}>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Data Inicial</label>
            <div style={{ position: 'relative' }}>
              <input type="date" name="dtStart" value={filters.dtStart} onChange={handleChange} style={dateInputStyle} />
              <span style={calendarIconStyle}>📅</span>
            </div>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Data Final</label>
            <div style={{ position: 'relative' }}>
              <input type="date" name="dtEnd" value={filters.dtEnd} onChange={handleChange} style={dateInputStyle} />
              <span style={calendarIconStyle}>📅</span>
            </div>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Valor</label>
            <input type="number" name="amount" value={filters.amount} onChange={handleChange} placeholder="Ex: 10005" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Card BIN</label>
            <input type="text" name="card_bin" value={filters.card_bin} onChange={handleChange} maxLength={6} placeholder="6 dígitos" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Card Last</label>
            <input type="text" name="card_last" value={filters.card_last} onChange={handleChange} maxLength={4} placeholder="4 dígitos" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Card Token</label>
            <input type="text" name="card_token" value={filters.card_token} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Transaction ID</label>
            <input type="text" name="transaction_id" value={filters.transaction_id} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Correlation ID</label>
            <input type="text" name="correlation_id" value={filters.correlation_id} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Application Name</label>
            <input type="text" name="application_name" value={filters.application_name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Card Exp Date</label>
            <input type="text" name="card_exp_date" value={filters.card_exp_date} onChange={handleChange} placeholder="MM/YYYY" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>NSU</label>
            <input type="text" name="nsu" value={filters.nsu} onChange={handleChange} placeholder="NSU" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4, display: 'block' }}>Authorization Code</label>
            <input type="text" name="authorization_code" value={filters.authorization_code} onChange={handleChange} placeholder="Authorization Code" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="submit" style={{ padding: '14px 48px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(25,118,210,0.10)' }} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>
      {error && <div className="error">{error}</div>}
      {results.length > 0 ? (
        <div style={{ 
          overflowX: 'auto', 
          marginTop: 24,
          maxWidth: '100%',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          boxShadow: '0 2px 12px rgba(25,118,210,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 16px', marginTop: 16 }}>
            <span style={{ color: '#1976d2', fontWeight: 600, fontSize: 16 }}>
              Exibindo <b>{filteredResults.length}</b> registro(s)
              {sortField && (
                <span style={{ fontSize: 14, color: '#666', marginLeft: 8 }}>
                  • Ordenado por: <b>{sortField.replace(/_/g, ' ').toUpperCase()}</b> ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                </span>
              )}
            </span>
          </div>
          
          {/* Campo de pesquisa */}
          <div style={{ 
            padding: '0 16px 16px 16px',
            borderBottom: '1px solid #e0e0e0',
            marginBottom: 16
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8f9fa',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid #e0e0e0'
            }}>
              <span style={{ marginRight: 8, fontSize: 16 }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar nos resultados..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 14,
                  width: '100%',
                  color: '#333'
                }}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#666',
                    padding: '4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <table className="results-table" style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            background: '#fff', 
            minWidth: 1200,
            margin: 0
          }}>
            <thead>
              <tr>
                {Object.keys(results[0]).map(key => (
                  <th
                    key={key}
                    title={key}
                    onClick={() => handleSort(key)}
                    style={{
                      padding: 12,
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      color: '#fff',
                      border: '1px solid #e0e0e0',
                      fontSize: 15,
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      maxWidth: 180,
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      textAlign: 'center',
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                      <span title={key}>{key.replace(/_/g, ' ').toUpperCase()}</span>
                      <span style={{ 
                        fontSize: 18, 
                        fontWeight: 'bold',
                        color: sortField === key ? '#ffffff' : '#e3f2fd',
                        background: sortField === key ? '#1976d2' : 'rgba(25,118,210,0.3)',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 6,
                        border: sortField === key ? '2px solid #ffffff' : '1px solid rgba(25,118,210,0.5)',
                        boxShadow: sortField === key ? '0 2px 8px rgba(25,118,210,0.4)' : '0 1px 3px rgba(25,118,210,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}>
                        {sortField === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? '#f7fafd' : '#fff',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = '#e3f0fc')}
                  onMouseOut={e => (e.currentTarget.style.background = i % 2 === 0 ? '#f7fafd' : '#fff')}
                >
                  {Object.entries(row).map(([key, val], j) => {
                    // Formatação de valores
                    let displayVal = formatValue(val, key);
                    // Truncar textos longos
                    const isLong = typeof displayVal === 'string' && displayVal.length > 32;
                    return (
                      <td
                        key={j}
                        title={isLong ? displayVal : undefined}
                        style={{
                          padding: 12,
                          border: '1px solid #e0e0e0',
                          fontSize: 14,
                          maxWidth: 180,
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          overflow: 'hidden',
                          textAlign: 'center',
                          background: 'inherit',
                          verticalAlign: 'top',
                          lineHeight: '1.4'
                        }}
                      >
                        {isLong ? displayVal.slice(0, 30) + '…' : displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <div style={{ textAlign: 'center', color: '#bdbdbd', marginTop: 32, fontSize: 18 }}>Nenhum resultado encontrado.</div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '2px solid #e3e3e3',
  borderRadius: 6,
  fontSize: 16,
  background: '#fff',
  color: '#333',
  marginBottom: 0,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const dateInputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '2px solid #e3e3e3',
  borderRadius: 6,
  fontSize: 16,
  background: '#fff',
  color: '#333',
  marginBottom: 0,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
  cursor: 'pointer',
  position: 'relative',
};

// Estilo para o ícone de calendário
const calendarIconStyle = {
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: '#1976d2',
  fontSize: '18px',
  pointerEvents: 'none',
  zIndex: 1,
};

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          // Verificar se o token ainda é válido
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
            setUser(JSON.parse(savedUser));
          } else {
            // Token inválido, limpar localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = (data) => {
    setIsAuthenticated(true);
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Função para adicionar token às requisições
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: '#fff',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <img src={bemobiLogo} alt="Bemobi" style={{ maxWidth: '150px', marginBottom: '20px' }} />
          <p style={{ color: '#666', margin: '0' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostrar tela de login se não autenticado
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-layout">
        <header className="top-navbar">
          <div className="navbar-brand">
            <img src={bemobiLogo} alt="Bemobi" className="navbar-logo" />
            <span className="navbar-title">Portal de Consultas Subadquirência</span>
          </div>
          
          <nav className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
            <ul className="navbar-nav">
              {(user?.role === 'admin' || user?.permissions?.includes('home')) && (
                <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>🏠 Principal</NavLink></li>
              )}
              {(user?.role === 'admin' || user?.permissions?.includes('antifraude')) && (
                <li><NavLink to="/antifraude" className={({ isActive }) => isActive ? 'active' : ''}>🛡️ Consultas de Prevenção</NavLink></li>
              )}
              {(user?.role === 'admin' || user?.permissions?.includes('bolepix')) && (
                <li><NavLink to="/bolepix" className={({ isActive }) => isActive ? 'active' : ''}>💳 Consulta BolePIX AE</NavLink></li>
              )}
              {(user?.role === 'admin' || user?.permissions?.includes('cielo_gerar_token') || user?.permissions?.includes('cielo_solicitar_cancelamento') || user?.permissions?.includes('cielo_carta_cancelamento') || user?.permissions?.includes('cielo_cancelamento_pm')) && (
                <li className="dropdown">
                  <span className="dropdown-toggle">
                    🏦 Cielo ▼
                  </span>
                  <ul className="dropdown-menu">
                    {(user?.role === 'admin' || user?.permissions?.includes('cielo_gerar_token')) && (
                      <li><NavLink to="/cielo/gerar-token" className={({ isActive }) => isActive ? 'active' : ''}>🔑 Gerar Token</NavLink></li>
                    )}
                    {(user?.role === 'admin' || user?.permissions?.includes('cielo_solicitar_cancelamento')) && (
                      <li><NavLink to="/cielo/solicitar-cancelamento" className={({ isActive }) => isActive ? 'active' : ''}>❌ Solicitar Cancelamento</NavLink></li>
                    )}
                    {(user?.role === 'admin' || user?.permissions?.includes('cielo_carta_cancelamento')) && (
                      <li><NavLink to="/cielo/carta-cancelamento" className={({ isActive }) => isActive ? 'active' : ''}>📄 Carta de Cancelamento</NavLink></li>
                    )}
                    {(user?.role === 'admin' || user?.permissions?.includes('cielo_cancelamento_pm')) && (
                      <li><NavLink to="/cielo/cancelamento-pm" className={({ isActive }) => isActive ? 'active' : ''}>🔄 Cancelamento PM</NavLink></li>
                    )}
                  </ul>
                </li>
              )}
              {(user?.role === 'admin' || user?.permissions?.includes('pagamentos_gma') || user?.permissions?.includes('pagamentos_posnegado')) && (
                <li className="dropdown">
                  <span className="dropdown-toggle">
                    💸 Pagamentos ▼
                  </span>
                  <ul className="dropdown-menu">
                    {(user?.role === 'admin' || user?.permissions?.includes('pagamentos_gma')) && (
                      <li><NavLink to="/pagamentos/gma" className={({ isActive }) => isActive ? 'active' : ''}>Web - PIX (GMA)</NavLink></li>
                    )}
                    {(user?.role === 'admin' || user?.permissions?.includes('pagamentos_posnegado')) && (
                      <li><NavLink to="/pagamentos/posnegado" className={({ isActive }) => isActive ? 'active' : ''}>Pagamento POS Negado</NavLink></li>
                    )}
                  </ul>
                </li>
              )}
              {(user?.role === 'admin' || user?.permissions?.includes('usuarios')) && (
                <li><NavLink to="/usuarios" className={({ isActive }) => isActive ? 'active' : ''}>👥 Gerenciar Usuários</NavLink></li>
              )}
            </ul>
          </nav>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Informações do usuário */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#fff',
              fontSize: '14px'
            }}>
              <span>👤 {user?.name}</span>
              <span style={{ 
                background: user?.role === 'admin' ? '#ff9800' : '#4caf50',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {user?.role === 'admin' ? 'ADMIN' : 'USER'}
              </span>

            </div>
            
            {/* Botão de logout */}
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => (e.target.style.background = 'rgba(255,255,255,0.2)')}
              onMouseOut={(e) => (e.target.style.background = 'rgba(255,255,255,0.1)')}
            >
              🚪 Sair
            </button>
            
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✖' : '☰'}
            </button>
          </div>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/antifraude" element={<Antifraude />} />
            <Route path="/bolepix" element={<BolepixAE />} />
            <Route path="/cielo/gerar-token" element={<CieloGerarToken />} />
            <Route path="/cielo/solicitar-cancelamento" element={<CieloSolicitarCancelamento />} />
            <Route path="/cielo/carta-cancelamento" element={<CieloCartaCancelamento />} />
            <Route path="/cielo/cancelamento-pm" element={<CieloCancelamentoPM />} />
            <Route path="/pagamentos/gma" element={<Pagamentos submenu="gma" />} />
            <Route path="/pagamentos/posnegado" element={<Pagamentos submenu="posnegado" />} />
            <Route path="/usuarios" element={<UserManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App
