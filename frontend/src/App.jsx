import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import './App.css'
import bmbIcon from './bmb.png'

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
          <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Portal de Consultas Subadquirência</h1>
        <p className="page-subtitle">Central de ferramentas para consultas e gestão de transações</p>
      </div>
      
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>Consultas de Prevenção</h3>
          <p>Sistema integrado de consultas às bases de dados de prevenção e antifraude para validação de transações</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">💳</div>
          <h3>Consulta BolePIX AE</h3>
          <p>Ferramenta para consultas de boletos e PIX no sistema de antecipação de recebíveis</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">🏦</div>
          <h3>Ferramentas Cielo</h3>
          <p>Gestão completa de tokens, solicitações de cancelamento e cartas de cancelamento Cielo</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">💸</div>
          <h3>Consultas de Pagamentos</h3>
          <p>Análise detalhada de transações Web, PIX e pagamentos POS com filtros avançados</p>
        </div>
        

        
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Relatórios e Analytics</h3>
          <p>Exportação de dados e análises estatísticas das consultas realizadas</p>
        </div>
      </div>
    </div>
  );
}

function Antifraude() {
  const [documentNumber, setDocumentNumber] = useState('');
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
      const res = await fetch('/api/antifraude', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ table: selectedTable, document: documentNumber }),
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
    setDocumentNumber('');
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
    try {
      console.log('🎯 Iniciando exportação CSV...');
      
      if (!result || result.length === 0) {
        alert('❌ Nenhum resultado disponível para exportar!');
        return;
      }
      
      // Usar dados filtrados (sortedData já inclui filtros e ordenação)
      const dataToExport = filteredData && filteredData.length > 0 ? filteredData : result;
      console.log(`📊 Exportando ${dataToExport.length} registros`);
      
      if (dataToExport.length === 0) {
        alert('❌ Nenhum dado disponível após aplicar filtros!');
        return;
      }
      
      // Pegar as primeiras 10 colunas principais (simplificado)
      const allColumns = Object.keys(dataToExport[0]);
      const mainColumns = allColumns.filter(col => 
        !col.includes('stats') && 
        !col.includes('address') && 
        !col.includes('phone') && 
        !col.includes('network') &&
        !col.includes('organization') &&
        !col.includes('latitude') &&
        !col.includes('longitude') &&
        !col.includes('radius') &&
        !col.includes('context') &&
        !col.includes('analysis_id') &&
        !col.includes('hierarchy') &&
        !col.includes('risk_score') &&
        !col.includes('domain_id') &&
        !col.includes('test_ab')
      ).slice(0, 15); // Limite de 15 colunas principais
      
      console.log(`📝 Exportando ${mainColumns.length} colunas:`, mainColumns);
      
      // Headers simples
      const headers = mainColumns.map(col => col.replace(/_/g, ' ').toUpperCase()).join(',');
      
      // Dados simples
      const rows = dataToExport.map(row => 
        mainColumns.map(col => {
          let value = row[col];
          if (value === null || value === undefined) return '';
          
          // Converter para string e limpar
          value = String(value).replace(/[\r\n]/g, ' ').trim();
          
          // Se contém vírgula ou aspas, envolver em aspas duplas
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        }).join(',')
      );
      
      console.log(`🔢 ${rows.length} linhas processadas`);
      
      // Gerar CSV
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Download
      const link = window.document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `antifraude_${selectedTable}_${timestamp}.csv`;
      
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      // Feedback visual
      const btn = window.document.querySelector('.btn-export');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Exportado!';
        btn.style.background = '#4caf50';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
        }, 2000);
      }
      
      console.log('✅ CSV exportado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro na exportação:', error);
      alert(`Erro ao exportar: ${error.message}`);
    }
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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🛡️ Consultas de Prevenção</h1>
        <p className="page-subtitle">Sistema integrado de consultas às bases de dados de prevenção e antifraude</p>
      </div>
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="selectedTable" className="form-label">
                🗂️ Tabela para Consulta
              </label>
              <select
                id="selectedTable"
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
                className="form-select"
                required
              >
                {tableOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="document" className="form-label">
                📄 Documento do Cliente
              </label>
              <input
                type="text"
                id="document"
                value={documentNumber}
                onChange={e => setDocumentNumber(e.target.value)}
                placeholder="Digite o CPF/CNPJ"
                className="form-input"
                required
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginTop: 'var(--spacing-xl)' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !documentNumber}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Consultando...
                </>
              ) : (
                <>
                  🔍 Consultar
                </>
              )}
            </button>
            
            {result && (
              <button type="button" className="btn btn-secondary" onClick={handleNewSearch}>
                🔄 Nova Consulta
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <div className="alert-title">Erro na consulta</div>
            <div>{error}</div>
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
          
          {/* Resultados da Consulta */}
          <div style={{ width: '100%', overflowX: 'auto', maxWidth: '100vw', margin: '0 auto', paddingBottom: 24 }}>
            <table className="results-table" style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              background: '#fff', 
              minWidth: 900,
              margin: 0
            }}>
              <thead>
                <tr>
                  {Object.keys(result[0]).map(key => {
                    const isSpecialColumn = [
                      'transaction_id_gma',
                      'workspace_id_gma',
                      'card_token_gma'
                    ].includes(key.toLowerCase());
                    const isExecutionStats = key.toLowerCase() === 'execution_stats';
                    return (
                      <th
                        key={key}
                        title={key}
                        onClick={() => handleSort(key)}
                        style={{
                          padding: 16,
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          color: '#fff',
                          border: '1px solid #e0e0e0',
                          fontSize: 15,
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          maxWidth: isExecutionStats ? 320 : (isSpecialColumn ? 600 : 300),
                          minWidth: isExecutionStats ? 280 : (isSpecialColumn ? 400 : 200),
                          whiteSpace: isExecutionStats ? 'pre-wrap' : (isSpecialColumn ? 'pre-wrap' : 'normal'),
                          wordBreak: isExecutionStats ? 'break-word' : (isSpecialColumn ? 'break-all' : 'break-word'),
                          overflowWrap: isExecutionStats ? 'break-word' : (isSpecialColumn ? 'break-word' : undefined),
                          overflow: 'visible',
                          textOverflow: undefined
                        }}
                      >
                        {key}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
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
                      const isSpecialColumn = [
                        'transaction_id_gma',
                        'workspace_id_gma',
                        'card_token_gma'
                      ].includes(key.toLowerCase());
                      const isExecutionStats = key.toLowerCase() === 'execution_stats';
                      let displayVal = formatValue(val, key);
                      // Debug para transaction_id_gma
                      if (key.toLowerCase() === 'transaction_id_gma') {
                        console.log('Transaction ID GMA:', displayVal);
                        console.log('Tipo:', typeof displayVal);
                        console.log('Contém pipe:', displayVal.includes('|'));
                        console.log('Split result:', displayVal.split('|'));
                      }
                      return (
                        <td
                          key={j}
                          title={displayVal}
                          className={isExecutionStats ? 'execution-stats-column' : (isSpecialColumn ? 'special-column' : '')}
                          style={{
                            padding: isExecutionStats ? 8 : 16,
                            border: '1px solid #e0e0e0',
                            fontSize: isExecutionStats ? 12 : 14,
                            maxWidth: isExecutionStats ? 320 : (isSpecialColumn ? 600 : 300),
                            minWidth: isExecutionStats ? 280 : (isSpecialColumn ? 400 : 200),
                            whiteSpace: isExecutionStats ? 'pre-wrap !important' : (isSpecialColumn ? 'pre-wrap !important' : 'normal'),
                            wordBreak: isExecutionStats ? 'break-word !important' : (isSpecialColumn ? 'break-all !important' : 'break-word'),
                            overflowWrap: isExecutionStats ? 'break-word !important' : (isSpecialColumn ? 'anywhere !important' : 'normal'),
                            textAlign: isExecutionStats ? 'left' : 'center',
                            background: isExecutionStats ? '#f8f9fa' : (isSpecialColumn ? '#f8f9fa' : 'inherit'),
                            verticalAlign: 'top',
                            lineHeight: isExecutionStats ? '1.3' : '1.4',
                            fontFamily: isExecutionStats ? 'Courier New, monospace' : 'inherit',
                            ...(isExecutionStats && {
                              whiteSpace: 'pre-wrap !important',
                              wordBreak: 'break-word !important',
                              overflowWrap: 'break-word !important',
                              overflow: 'visible !important',
                              textOverflow: 'unset !important'
                            }),
                            ...(isSpecialColumn && !isExecutionStats && {
                              whiteSpace: 'pre-wrap !important',
                              wordBreak: 'break-all !important',
                              overflowWrap: 'anywhere !important',
                              overflow: 'visible !important',
                              textOverflow: 'unset !important'
                            })
                          }}
                        >
                          {isSpecialColumn && typeof displayVal === 'string'
                            ? displayVal.split('|').map((part, idx, arr) => (
                                <React.Fragment key={idx}>
                                  {part}
                                  {idx < arr.length - 1 && <br />}
                                </React.Fragment>
                              ))
                            : isSpecialColumn && displayVal && String(displayVal).includes('|')
                            ? String(displayVal).split('|').map((part, idx, arr) => (
                                <React.Fragment key={idx}>
                                  {part}
                                  {idx < arr.length - 1 && <br />}
                                </React.Fragment>
                              ))
                            : displayVal}
                        </td>
                      );
                    })}
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
          <p>Não foram encontrados registros para o documento <strong>{documentNumber}</strong> na tabela selecionada.</p>
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
      const res = await fetch('/api/bolepix', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
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
      const res = await fetch(`/api/correlation/${correlationId}`);
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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">💳 Consulta BolePIX AE</h1>
        <p className="page-subtitle">Sistema de consulta de boletos e PIX para antecipação de recebíveis</p>
      </div>
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="correlation_id" className="form-label">
                🔗 Correlation ID
              </label>
              <input
                type="text"
                name="correlation_id"
                id="correlation_id"
                placeholder="Digite o Correlation ID"
                value={form.correlation_id}
                onChange={handleChange}
                maxLength={36}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="application_id" className="form-label">
                📱 Application ID
              </label>
              <input
                type="text"
                name="application_id"
                id="application_id"
                placeholder="Application ID"
                value={form.application_id}
                onChange={handleChange}
                className="form-input"
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="workspace_id" className="form-label">
                🏢 Workspace ID
              </label>
              <input
                type="text"
                name="workspace_id"
                id="workspace_id"
                placeholder="Workspace ID"
                value={form.workspace_id}
                onChange={handleChange}
                className="form-input"
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="company_id" className="form-label">
                🏪 Company ID
              </label>
              <input
                type="text"
                name="company_id"
                id="company_id"
                placeholder="Company ID"
                value={form.company_id}
                onChange={handleChange}
                className="form-input"
                readOnly
              />
            </div>
          </div>

          {!isCorrelationComplete && !isFieldsFilled && (
            <div className="alert alert-info">
              <span className="alert-icon">ℹ️</span>
              <div className="alert-content">
                <div className="alert-title">Aguardando dados</div>
                <div>Digite o Correlation ID para buscar os dados automaticamente</div>
              </div>
            </div>
          )}
          
          {isCorrelationComplete && !isFieldsFilled && (
            <div className="alert alert-warning">
              <span className="alert-icon">⏳</span>
              <div className="alert-content">
                <div className="alert-title">Consultando</div>
                <div>Aguarde enquanto consultamos os dados no banco</div>
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginTop: 'var(--spacing-xl)' }}>
            {isFieldsFilled && (
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Consultando...
                  </>
                ) : (
                  <>
                    🔍 Consultar BolePIX
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          <div className="alert-content">
            <div className="alert-title">Erro na consulta</div>
            <div>{error}</div>
          </div>
        </div>
      )}
      
      {result && (
        <>
          <div className="card">
            <div className="card-header">
              <h2>📋 Resultado da Consulta</h2>
            </div>
            <div className="card-body">
              <div className="result-item">
                <span className="result-label">Descrição:</span>
                <span className="result-value">{result.description}</span>
              </div>
            
            <div className="result-item">
              <span className="result-label">Valor:</span>
              <span className="result-value" style={{color: '#28a745', fontWeight: 'bold'}}>{formatCurrency(result.value)}</span>
            </div>
            
            <div className="result-item">
              <span className="result-label">Status:</span>
              <span className="result-value">{result.status}</span>
            </div>
            
            <div className="result-item">
              <span className="result-label">Data de Emissão:</span>
              <span className="result-value">{result.issueDate}</span>
            </div>
            
            <div className="result-item">
              <span className="result-label">Data de Vencimento:</span>
              <span className="result-value">{result.dueDate}</span>
            </div>
            
            <div className="result-item">
              <span className="result-label">Nosso Número:</span>
              <span className="result-value">{result.ourNumber}</span>
            </div>
            
            <div className="result-item">
              <span className="result-label">Número do Documento:</span>
              <span className="result-value">{result.documentNumber}</span>
            </div>
            
            <div className="result-item">
              <span className="result-label">Código de Barras:</span>
              <span className="result-value">{result.barCodeFormatted}</span>
            </div>
            
            {result.boletoUrl && (
              <div className="result-item">
                <span className="result-label">Boleto:</span>
                <a href={result.boletoUrl} target="_blank" rel="noopener noreferrer" className="modern-btn success" style={{textDecoration: 'none', padding: '8px 16px', fontSize: '0.9rem'}}>
                  📄 Ver Boleto
                </a>
              </div>
            )}
            
              {result.qrcode && result.qrcode.qrCodeBase64 && (
                <div style={{textAlign: 'center', marginTop: '24px', padding: '24px', background: '#f8f9fa', borderRadius: '12px'}}>
                  <h3 style={{margin: '0 0 16px 0', color: '#495057'}}>QR Code PIX</h3>
                  <img 
                    src={`data:image/png;base64,${result.qrcode.qrCodeBase64}`} 
                    alt="QR Code PIX" 
                    style={{maxWidth: '200px', border: '2px solid #e9ecef', borderRadius: '8px'}} 
                  />
                  <div style={{marginTop: '16px', padding: '12px', background: 'white', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all'}}>
                    {result.qrcode.copyAndPaste}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', marginTop: 'var(--spacing-xl)' }}>
            <button type="button" className="btn btn-secondary" onClick={handleNewSearch}>
              🔄 Nova Consulta
            </button>
          </div>
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
      <div className="page-header">
        <h1>🔑 Gerar Token - Cielo</h1>
        <p className="subtitle">Geração de token de acesso para integração com APIs da Cielo</p>
      </div>
      
      <div className="modern-alert info" style={{ marginBottom: '32px' }}>
        <span className="alert-icon">🔐</span>
        <div className="alert-content">
          <div className="alert-title">Como obter o CODE da Cielo</div>
          <div>
            <strong>Passo a passo:</strong>
            <ol style={{ margin: '8px 0 0 16px' }}>
              <li>Clique em "🌐 Abrir Cielo OAuth"</li>
              <li>Faça login na sua conta Cielo</li>
              <li>Selecione a empresa desejada</li>
              <li>Você será redirecionado para uma URL como: <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>https://www.cielo.com.br?code=ABC123...</code></li>
              <li>Copie o valor do parâmetro <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>code=</code> da URL</li>
              <li>Volte para esta página e clique em "📋 Colar CODE" ou cole manualmente no campo</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div className="btn-container" style={{ marginBottom: '32px' }}>
        <button 
          onClick={() => {
            const width = Math.round(window.screen.width * 0.4);
            const height = Math.round(window.screen.height * 0.4);
            const left = Math.round((window.screen.width - width) / 2);
            const top = Math.round((window.screen.height - height) / 2);
            
            window.open(
              'https://minhaconta2.cielo.com.br/oauth/?mode=redirect&client_id=69d136cb-f7ca-4f4e-850c-e5975d41dba6&redirect_uri=https:%2F%2Fwww.cielo.com.br&state=123456&scope=transaction_read,transaction_write',
              'cieloOAuth',
              `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,menubar=no,toolbar=no,location=yes`
            );
          }}
          className="modern-btn"
        >
          🌐 Abrir Cielo OAuth
        </button>
      </div>

      <form onSubmit={handleSubmit} className="modern-form">
        <div className="form-field">
          <label htmlFor="code">🔗 CODE da Cielo</label>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'stretch'
          }}>
            <input
              type="text"
              id="code"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Cole aqui o CODE obtido da Cielo"
              required
              maxLength={100}
              style={{ 
                flex: 1,
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={pasteCodeFromClipboard}
              className="modern-btn success"
            >
              📋 Colar CODE
            </button>
          </div>
        </div>
        
        <div className="btn-container">
          <button
            type="submit"
            className="modern-btn"
            disabled={loading || !code}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Gerando...
              </>
            ) : (
              <>
                🔑 Gerar Token
              </>
            )}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="modern-alert error">
          <span className="alert-icon">❌</span>
          <div className="alert-content">
            <div className="alert-title">Erro ao gerar token</div>
            <div>{error}</div>
          </div>
        </div>
      )}
      
      {accessToken && (
        <div className="result-card">
          <h2>✅ Token Gerado com Sucesso</h2>
          
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'stretch',
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #28a745'
          }}>
            <input
              type="text"
              value={accessToken}
              readOnly
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                background: 'white',
                color: '#333',
                textAlign: 'center'
              }}
            />
            <button
              onClick={handleCopyToken}
              className={`modern-btn ${copied ? 'success' : ''}`}
              style={{ 
                minWidth: '120px',
                alignSelf: 'center'
              }}
            >
              {copied ? '✅ Copiado!' : '📋 Copiar'}
            </button>
          </div>
          
          <div className="modern-alert success" style={{ marginTop: '16px' }}>
            <span className="alert-icon">💡</span>
            <div className="alert-content">
              <div className="alert-title">Token pronto para uso</div>
              <div>Este token pode ser usado nas outras funcionalidades da Cielo. Mantenha-o seguro!</div>
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
  const [bodyCopied, setBodyCopied] = useState(false);
  
  // Estados para geração de token
  const [code, setCode] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // Função para formatar valor em centavos para exibição
  const formatCurrencyInput = (centavos) => {
    if (!centavos || centavos === '') return '';
    
    // Converter centavos para reais
    const valorEmReais = parseFloat(centavos) / 100;
    
    // Formatar como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(valorEmReais);
  };

  // Função para copiar o body para a área de transferência
  const handleCopyBody = async () => {
    if (!bodyEnviado) return;
    
    try {
      const bodyText = JSON.stringify(bodyEnviado, null, 2);
      await navigator.clipboard.writeText(bodyText);
      setBodyCopied(true);
      // Resetar o estado após 2 segundos
      setTimeout(() => setBodyCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(bodyEnviado, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setBodyCopied(true);
      setTimeout(() => setBodyCopied(false), 2000);
    }
  };

  // Função para formatar entrada de valor
  const handleValueChange = (e) => {
    let inputValue = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    
    // Permitir que o campo fique vazio quando o usuário apagar tudo
    if (inputValue === '') {
      setValue('');
      return;
    }
    
    // Limitar a 8 dígitos para evitar valores muito grandes
    if (inputValue.length > 8) {
      inputValue = inputValue.slice(0, 8);
    }
    
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
    setBodyCopied(false);
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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">💳 Solicitar Cancelamento - Cielo</h1>
        <p className="page-subtitle">Sistema de solicitação de cancelamento de transações com geração automática de token</p>
      </div>
      
      {/* Seção de Informações */}
      <div className="modern-alert info" style={{ marginBottom: '32px' }}>
        <span className="alert-icon">🔐</span>
        <div className="alert-content">
          <div className="alert-title">Como obter o CODE da Cielo</div>
          <div>
            <strong>Passo a passo:</strong>
            <ol style={{ margin: '8px 0 0 16px' }}>
              <li>Clique em "🌐 Abrir Cielo OAuth"</li>
              <li>Faça login na sua conta Cielo</li>
              <li>Selecione a empresa desejada</li>
              <li>Você será redirecionado para uma URL como: <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>https://www.cielo.com.br?code=ABC123...</code></li>
              <li>Copie o valor do parâmetro <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>code=</code> da URL</li>
              <li>Volte para esta página e cole o code no campo abaixo</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div className="btn-container" style={{ marginBottom: '32px' }}>
        <button 
          onClick={() => {
            const width = Math.round(window.screen.width * 0.4);
            const height = Math.round(window.screen.height * 0.4);
            const left = Math.round((window.screen.width - width) / 2);
            const top = Math.round((window.screen.height - height) / 2);
            
            window.open(
              'https://minhaconta2.cielo.com.br/oauth/?mode=redirect&client_id=69d136cb-f7ca-4f4e-850c-e5975d41dba6&redirect_uri=https:%2F%2Fwww.cielo.com.br&state=123456&scope=transaction_read,transaction_write',
              'cieloOAuth',
              `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,menubar=no,toolbar=no,location=yes`
            );
          }}
          className="modern-btn"
        >
          🌐 Abrir Cielo OAuth
        </button>
      </div>

      {/* Seção de Geração de Token */}
      <form onSubmit={handleGenerateToken} className="modern-form" style={{ marginBottom: '32px' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔑 Gerar Token de Acesso
        </h2>
        
        <div className="form-field">
          <label htmlFor="cielo-code">🔗 CODE da Cielo</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              id="cielo-code"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Cole aqui o CODE obtido da Cielo"
              required
              style={{ 
                flex: 1,
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  const clipboardText = await navigator.clipboard.readText();
                  if (clipboardText && clipboardText.length > 10) {
                    setCode(clipboardText);
                  } else {
                    alert('Nenhum texto válido encontrado na área de transferência.');
                  }
                } catch (err) {
                  alert('Não foi possível acessar a área de transferência. Cole o CODE manualmente no campo.');
                }
              }}
              className="modern-btn success"
              style={{ whiteSpace: 'nowrap' }}
            >
              📋 Colar CODE
            </button>
          </div>
        </div>
        
        <div className="btn-container">
          <button
            type="submit"
            className="modern-btn"
            disabled={tokenLoading || !code}
          >
            {tokenLoading ? (
              <>
                <span className="spinner"></span>
                Gerando Token...
              </>
            ) : (
              <>
                🔑 Gerar Token
              </>
            )}
          </button>
        </div>
      </form>

      {tokenError && (
        <div className="modern-alert error" style={{ marginBottom: '24px' }}>
          <span className="alert-icon">❌</span>
          <div className="alert-content">
            <div className="alert-title">Erro ao gerar token</div>
            <div>{tokenError}</div>
          </div>
        </div>
      )}

      {token && (
        <div className="modern-alert success" style={{ marginBottom: '32px' }}>
          <span className="alert-icon">✅</span>
          <div className="alert-content">
            <div className="alert-title">Token gerado com sucesso!</div>
            <div>O token foi preenchido automaticamente no formulário abaixo. Agora você pode preencher os dados da transação.</div>
          </div>
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="modern-form">
        <h2 style={{ color: 'var(--primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💳 Dados da Transação
        </h2>
        
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="token">🔑 Token de Acesso</label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Token será preenchido automaticamente após gerar"
              required
              readOnly
              style={{ 
                background: token ? '#f0f8ff' : '#f5f5f5', 
                cursor: 'not-allowed',
                fontFamily: 'monospace',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div className="form-field">
            <label htmlFor="merchantID">🏢 Merchant ID</label>
            <input
              type="text"
              id="merchantID"
              value={merchantID}
              onChange={e => setMerchantID(e.target.value)}
              placeholder="Merchant ID"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="nsu">🔢 NSU</label>
            <input
              type="number"
              id="nsu"
              value={nsu}
              onChange={e => setNsu(e.target.value)}
              placeholder="NSU da transação"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="cardNumberLast4Digits">💳 Últimos 4 dígitos do cartão</label>
            <input
              type="text"
              id="cardNumberLast4Digits"
              value={cardNumberLast4Digits}
              onChange={e => setCardNumberLast4Digits(e.target.value)}
              placeholder="Ex: 4601"
              maxLength={4}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="authorizationCode">🔐 Código de Autorização</label>
            <input
              type="text"
              id="authorizationCode"
              value={authorizationCode}
              onChange={e => setAuthorizationCode(e.target.value)}
              placeholder="Código de Autorização"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="value">💰 Valor (R$)</label>
            <input
              type="text"
              id="value"
              value={formatCurrencyInput(value)}
              onChange={handleValueChange}
              placeholder="R$ 0,00"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="transactionDate">📅 Data da Transação</label>
            <input
              type="datetime-local"
              id="transactionDate"
              value={transactionDate}
              onChange={e => setTransactionDate(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="btn-container">
          <button 
            type="submit" 
            className="modern-btn" 
            disabled={loading || !token || !merchantID || !nsu || !cardNumberLast4Digits || !authorizationCode || !value || !transactionDate}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processando...
              </>
            ) : (
              <>
                ✅ Solicitar Cancelamento
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="modern-alert error" style={{ marginTop: '24px' }}>
          <span className="alert-icon">❌</span>
          <div className="alert-content">
            <div className="alert-title">Erro na solicitação</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {result && (
        <div className="result-card" style={{ marginTop: '32px' }}>
          <h2>✅ Resultado da Solicitação</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <span style={{ fontWeight: '600' }}>📋 Body enviado:</span>
            <button 
              onClick={handleCopyBody}
              className={`modern-btn ${bodyCopied ? 'success' : 'secondary'}`}
              style={{ fontSize: '0.85rem', padding: '6px 12px' }}
            >
              {bodyCopied ? '✅ Copiado!' : '📋 Copiar Body'}
            </button>
          </div>
          
          <div style={{ 
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>📤 Dados Enviados:</h4>
            <pre style={{
              textAlign: 'left',
              background: 'white',
              padding: '12px',
              borderRadius: '6px',
              margin: 0,
              overflowX: 'auto',
              fontSize: '0.85rem',
              border: '1px solid #dee2e6'
            }}>{JSON.stringify(bodyEnviado, null, 2)}</pre>
          </div>
          
          <div style={{ 
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>📥 Resposta da API:</h4>
            <pre style={{
              textAlign: 'left',
              background: 'white',
              padding: '12px',
              borderRadius: '6px',
              margin: 0,
              overflowX: 'auto',
              fontSize: '0.85rem',
              border: '1px solid #dee2e6'
            }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
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

  // Estados para geração de token
  const [code, setCode] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  function tratarMerchantId(valor) {
    // Remove ponto e tudo após o E (inclusive E9), pega só os números antes do E
    let num = valor.toString().replace(/\./g, '');
    num = num.split('E')[0]; // Remove E e tudo após
    // Preenche com zeros à direita até 10 caracteres
    while (num.length < 10) num += '0';
    return num.slice(0, 10);
  }

  // Função para extrair code da URL
  const extractCodeFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromURL = urlParams.get('code');
    if (codeFromURL) {
      setCode(codeFromURL);
      return codeFromURL;
    }
    return null;
  };

  // Função para colar code da área de transferência
  const pasteCodeFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setCode(clipboardText);
    } catch (err) {
      console.error('Erro ao ler área de transferência:', err);
      setTokenError('Erro ao ler área de transferência. Cole manualmente o code.');
    }
  };

  // Função para gerar token
  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setTokenError('Code é obrigatório');
      return;
    }

    setTokenLoading(true);
    setTokenError('');
    setGeneratedToken('');

    try {
      const response = await fetch('/api/cielo/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Erro ao gerar token');
      }

      if (data.access_token) {
        setGeneratedToken(data.access_token);
        setToken(data.access_token); // Preenche automaticamente o campo do formulário
        setTokenError('');
      } else {
        throw new Error('Token não encontrado na resposta');
      }
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
      <div className="page-header">
        <h1>📄 Carta de Cancelamento - Cielo</h1>
        <p className="subtitle">Geração de carta de cancelamento com token automático</p>
      </div>

      {/* Seção de Geração de Token */}
      <div className="modern-alert info" style={{ marginBottom: '32px' }}>
        <span className="alert-icon">🔐</span>
        <div className="alert-content">
          <div className="alert-title">Como obter o CODE da Cielo</div>
          <div>
            <strong>Passo a passo:</strong>
            <ol style={{ margin: '8px 0 0 16px' }}>
              <li>Clique em "🌐 Abrir Cielo OAuth"</li>
              <li>Faça login na sua conta Cielo</li>
              <li>Selecione a empresa desejada</li>
              <li>Você será redirecionado para uma URL como: <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>https://www.cielo.com.br?code=ABC123...</code></li>
              <li>Copie o valor do parâmetro <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '3px' }}>code=</code> da URL</li>
              <li>Volte para esta página e clique em "📋 Colar CODE" ou cole manualmente no campo</li>
            </ol>
          </div>
        </div>
      </div>
      
      <div className="btn-container" style={{ marginBottom: '32px' }}>
        <button 
          onClick={() => {
            const width = Math.round(window.screen.width * 0.4);
            const height = Math.round(window.screen.height * 0.4);
            const left = Math.round((window.screen.width - width) / 2);
            const top = Math.round((window.screen.height - height) / 2);
            
            window.open(
              'https://minhaconta2.cielo.com.br/oauth/?mode=redirect&client_id=69d136cb-f7ca-4f4e-850c-e5975d41dba6&redirect_uri=https:%2F%2Fwww.cielo.com.br&state=123456&scope=transaction_read,transaction_write',
              'cieloOAuth',
              `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,menubar=no,toolbar=no,location=yes`
            );
          }}
          className="modern-btn"
        >
          🌐 Abrir Cielo OAuth
        </button>
      </div>

      <form onSubmit={handleGenerateToken} className="modern-form" style={{ marginBottom: '32px' }}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="code">
              🔑 Code da Cielo
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                id="code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Cole o code da URL da Cielo"
                required
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                onClick={pasteCodeFromClipboard}
                className="modern-btn secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                📋 Colar CODE
              </button>
            </div>
          </div>
        </div>
        
        <div className="btn-container">
          <button type="submit" className="modern-btn" disabled={tokenLoading || !code.trim()}>
            {tokenLoading ? (
              <>
                <span className="spinner"></span>
                Gerando Token...
              </>
            ) : (
              <>
                🔑 Gerar Token
              </>
            )}
          </button>
        </div>
      </form>

      {tokenError && (
        <div className="modern-alert error" style={{ marginBottom: '32px' }}>
          <span className="alert-icon">❌</span>
          <div className="alert-content">
            <div className="alert-title">Erro ao gerar token</div>
            <div>{tokenError}</div>
          </div>
        </div>
      )}

      {generatedToken && (
        <div className="modern-alert success" style={{ marginBottom: '32px' }}>
          <span className="alert-icon">✅</span>
          <div className="alert-content">
            <div className="alert-title">Token gerado com sucesso!</div>
            <div>O token foi preenchido automaticamente no campo "Token de Acesso"</div>
          </div>
        </div>
      )}

      {/* Separador visual */}
      <div style={{ 
        borderTop: '2px solid #e9ecef', 
        margin: '32px 0', 
        position: 'relative' 
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '-12px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          background: '#fff', 
          padding: '0 16px',
          color: '#6c757d',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          📄 Formulário de Carta de Cancelamento
        </div>
      </div>

      {/* Formulário de Carta de Cancelamento */}
      <form onSubmit={handleSubmit} className="modern-form">
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="token">
              🔑 Token de Acesso
            </label>
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
          </div>

          <div className="form-field">
            <label htmlFor="merchantId">
              🏢 Merchant ID
            </label>
        <input
          type="text"
          id="merchantId"
          value={merchantId}
          onChange={e => setMerchantId(e.target.value)}
          placeholder="Merchant ID"
          required
        />
          </div>

          <div className="form-field">
            <label htmlFor="cancellationId">
              🆔 Cancellation ID
            </label>
        <input
          type="text"
          id="cancellationId"
          value={cancellationId}
          onChange={e => setCancellationId(e.target.value)}
          placeholder="Cancellation ID"
          required
        />
          </div>
        </div>
        
        <div className="btn-container">
          <button type="submit" className="modern-btn" disabled={loading || !token || !merchantId || !cancellationId}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Gerando Carta...
              </>
            ) : (
              <>
                📄 Gerar Carta de Cancelamento
              </>
            )}
        </button>
        </div>
      </form>

      {error && (
        <div className="modern-alert error" style={{ marginTop: '24px' }}>
          <span className="alert-icon">❌</span>
          <div className="alert-content">
            <div className="alert-title">Erro ao gerar carta</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {pdfUrl && (
        <div className="modern-alert success" style={{ marginTop: '24px' }}>
          <span className="alert-icon">✅</span>
          <div className="alert-content">
            <div className="alert-title">Carta de Cancelamento gerada com sucesso!</div>
            <div style={{ marginTop: '8px' }}>
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                download="carta-cancelamento.pdf"
                className="modern-btn success"
                style={{ textDecoration: 'none' }}
              >
                📄 Baixar PDF
              </a>
            </div>
          </div>
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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🚫 Cancelamento PM - Cielo</h1>
        <p className="page-subtitle">Sistema de cancelamento de pagamentos com busca automática por Correlation ID</p>
      </div>

      {/* Informações sobre o cancelamento */}
      <div className="modern-alert info" style={{ marginBottom: '32px' }}>
        <span className="alert-icon">ℹ️</span>
        <div className="alert-content">
          <div className="alert-title">Como funciona o cancelamento</div>
          <div>
            <ul style={{ margin: '8px 0 0 16px' }}>
              <li>Digite o <strong>Correlation ID</strong> do pagamento</li>
              <li>Os dados serão carregados automaticamente</li>
              <li>Apenas pagamentos com status <strong>"Autorizado"</strong> podem ser cancelados</li>
              <li>O cancelamento é processado imediatamente</li>
            </ul>
          </div>
        </div>
      </div>

      <form className="modern-form">
        <h2 style={{ color: 'var(--primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔍 Buscar Pagamento
        </h2>
        
        <div className="form-field">
          <label htmlFor="correlationId">
            🆔 Correlation ID
          </label>
          <input
            type="text"
            id="correlationId"
            value={correlationId}
            onChange={e => setCorrelationId(e.target.value)}
            placeholder="Digite o Correlation ID do pagamento"
            required
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}
          />
          {buscando && (
            <div style={{ 
              marginTop: '8px', 
              color: 'var(--primary)', 
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
              Buscando dados do pagamento...
            </div>
          )}
        </div>

        {isDataLoaded && (
          <>
            <h2 style={{ color: 'var(--primary)', marginTop: '32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📋 Dados do Pagamento
            </h2>
            
            <div className="form-grid">
              <div className="form-field">
                <label>🏢 Company ID</label>
                <input 
                  type="text" 
                  value={companyId} 
                  readOnly 
                  style={{ 
                    background: '#f8f9fa', 
                    cursor: 'not-allowed',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div className="form-field">
                <label>📱 Application ID</label>
                <input 
                  type="text" 
                  value={applicationId} 
                  readOnly 
                  style={{ 
                    background: '#f8f9fa', 
                    cursor: 'not-allowed',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div className="form-field">
                <label>🏠 Workspace ID</label>
                <input 
                  type="text" 
                  value={workspaceId} 
                  readOnly 
                  style={{ 
                    background: '#f8f9fa', 
                    cursor: 'not-allowed',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div className="form-field">
                <label>💳 Tipo de Pagamento</label>
                <input 
                  type="text" 
                  value={paymentType} 
                  readOnly 
                  style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-field">
                <label>📅 Data</label>
                <input 
                  type="text" 
                  value={date} 
                  readOnly 
                  style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-field">
                <label>💰 Valor</label>
                <input 
                  type="text" 
                  value={formatCurrency(amountValue)} 
                  readOnly 
                  style={{ 
                    background: '#f8f9fa', 
                    cursor: 'not-allowed',
                    fontWeight: '600',
                    color: 'var(--success)'
                  }}
                />
              </div>

              <div className="form-field">
                <label>📊 Status</label>
                <input 
                  type="text" 
                  value={statusLabel} 
                  readOnly 
                  style={{ 
                    background: status === 'AUTHORIZED' ? '#e8f5e8' : '#fff3cd',
                    cursor: 'not-allowed',
                    fontWeight: '600',
                    color: status === 'AUTHORIZED' ? 'var(--success)' : 'var(--warning)'
                  }}
                />
              </div>
            </div>

            {status && status !== 'AUTHORIZED' && (
              <div className="modern-alert warning" style={{ marginTop: '24px' }}>
                <span className="alert-icon">⚠️</span>
                <div className="alert-content">
                  <div className="alert-title">Cancelamento não disponível</div>
                  <div>Cancelamento só é permitido para pagamentos com status <strong>"Autorizado"</strong>. Status atual: <strong>{statusLabel}</strong></div>
                </div>
              </div>
            )}

            {status === 'AUTHORIZED' && (
              <div className="btn-container" style={{ marginTop: '32px' }}>
                <button 
                  type="button" 
                  onClick={handleCancelamento}
                  disabled={loading}
                  className="modern-btn error"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Processando cancelamento...
                    </>
                  ) : (
                    <>
                      🚫 Confirmar Cancelamento
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </form>

      {error && (
        <div className="modern-alert error" style={{ marginTop: '24px' }}>
          <span className="alert-icon">❌</span>
          <div className="alert-content">
            <div className="alert-title">Erro na operação</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {result && (
        <div className="result-card" style={{ marginTop: '32px' }}>
          <h2>✅ Resultado do Cancelamento</h2>
          
          <div style={{ 
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>📥 Resposta da API:</h4>
            <pre style={{
              textAlign: 'left',
              background: 'white',
              padding: '12px',
              borderRadius: '6px',
              margin: 0,
              overflowX: 'auto',
              fontSize: '0.85rem',
              border: '1px solid #dee2e6'
            }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
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
  const [infoMessage, setInfoMessage] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Função para formatar entrada de valor monetário
  const handleAmountChange = (e) => {
    let inputValue = e.target.value;
    
    // Permitir apenas números, vírgula e ponto
    inputValue = inputValue.replace(/[^\d.,]/g, '');
    
    // Substituir vírgula por ponto para padronização
    inputValue = inputValue.replace(',', '.');
    
    // Garantir apenas um ponto decimal
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limitar a 2 casas decimais
    if (parts[1] && parts[1].length > 2) {
      inputValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setFilters(f => ({ ...f, amount: inputValue }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    
    // Tratamento especial para o campo amount na GMA
    if (name === 'amount' && submenu === 'gma') {
      handleAmountChange(e);
      return;
    }
    
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
    setInfoMessage('');
    setResults([]);
    
    try {
      const endpoint = submenu === 'gma' ? '/api/pagamentos/gma' : '/api/pagamentos/posnegado';
      const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na consulta');
      }

      const data = await response.json();
      
      // Tratar apenas respostas diretas (array de resultados)
      if (Array.isArray(data)) {
        setResults(data);
        
        // Se não há resultados, mostrar mensagem específica
        if (data.length === 0) {
          setInfoMessage('Nenhum resultado encontrado na tabela GMA com os filtros informados.');
        }
      } else {
        // Fallback para outros formatos
        setResults([]);
        setError('Formato de resposta inesperado do servidor');
      }
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
        <div className="pagamentos-header">
          <h1>❌ Pagamentos - Pagamento POS Negado</h1>
          <p className="subtitle">Consulte transações de pagamentos negadas no sistema POS</p>
        </div>
        
        <form onSubmit={handleSubmit} className="pagamentos-form">
          <div className="pagamentos-form-grid">
            <div className="pagamentos-form-field">
              <label>Data Inicial</label>
              <input 
                type="date" 
                name="dtStart" 
                value={filters.dtStart} 
                onChange={handleChange}
              />
              <span className="calendar-icon">📅</span>
            </div>
            
            <div className="pagamentos-form-field">
              <label>Data Final</label>
              <input 
                type="date" 
                name="dtEnd" 
                value={filters.dtEnd} 
                onChange={handleChange}
              />
              <span className="calendar-icon">📅</span>
            </div>
            
            <div className="pagamentos-form-field">
              <label>Valor Total</label>
              <input 
                type="number" 
                name="total_amount" 
                value={filters.total_amount} 
                onChange={handleChange} 
                placeholder="Ex: 41056"
              />
            </div>
            
            <div className="pagamentos-form-field">
              <label>BIN (6 dígitos)</label>
              <input 
                type="text" 
                name="transaction_bin" 
                value={filters.transaction_bin} 
                onChange={handleChange} 
                maxLength={6} 
                placeholder="6 dígitos"
              />
            </div>
            
            <div className="pagamentos-form-field">
              <label>PAN (4 últimos)</label>
              <input 
                type="text" 
                name="transaction_pan" 
                value={filters.transaction_pan} 
                onChange={handleChange} 
                maxLength={4} 
                placeholder="4 dígitos"
              />
            </div>
            
            <div className="pagamentos-form-field">
              <label>NSU</label>
              <input 
                type="text" 
                name="transaction_nsu" 
                value={filters.transaction_nsu} 
                onChange={handleChange} 
                placeholder="NSU"
              />
            </div>
            
            <div className="pagamentos-form-field">
              <label>Número de Autorização</label>
              <input 
                type="text" 
                name="transaction_authorization_number" 
                value={filters.transaction_authorization_number} 
                onChange={handleChange} 
                placeholder="Authorization Number"
              />
            </div>
          </div>
          
          <div className="pagamentos-submit-container">
            <button type="submit" className="pagamentos-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Buscando...
                </>
              ) : (
                <>
                  🔍 Buscar Pagamentos
                </>
              )}
            </button>
          </div>
        </form>
        
        {error && <div className="error">{error}</div>}
        {infoMessage && (
          <div className="alert alert-info" style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            color: '#1976d2'
          }}>
            <span style={{ marginRight: '8px' }}>ℹ️</span>
            {infoMessage}
          </div>
        )}
        {results.length > 0 ? (
          <div className="pagamentos-results-scroll" style={{
            maxHeight: '80vh',
            overflowY: 'auto',
            overflowX: 'auto',
            width: '100%',
            marginTop: 24,
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
              minWidth: 1800,
              margin: 0
            }}>
              <thead>
                <tr>
                  {Object.keys(results[0]).map(key => {
                    const isSpecialColumn = [
                      'transaction_id_gma',
                      'workspace_id_gma',
                      'card_token_gma'
                    ].includes(key.toLowerCase());
                    return (
                      <th
                        key={key}
                        title={key}
                        onClick={() => handleSort(key)}
                        style={{
                          padding: 16,
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          color: '#fff',
                          border: '1px solid #e0e0e0',
                          fontSize: 15,
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          maxWidth: isSpecialColumn ? 600 : 300,
                          minWidth: isSpecialColumn ? 400 : 200,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}
                      >
                        {key}
                      </th>
                    );
                  })}
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
                      const isSpecialColumn = [
                        'transaction_id_gma',
                        'workspace_id_gma',
                        'card_token_gma'
                      ].includes(key.toLowerCase());
                      let displayVal = formatValue(val, key);
                      
                      // Debug para transaction_id_gma
                      if (key.toLowerCase() === 'transaction_id_gma') {
                        console.log('Transaction ID GMA:', displayVal);
                        console.log('Tipo:', typeof displayVal);
                        console.log('Contém pipe:', displayVal.includes('|'));
                        console.log('Split result:', displayVal.split('|'));
                      }
                      
                      return (
                        <td
                          key={j}
                          title={displayVal}
                          className={isSpecialColumn ? 'special-column' : ''}
                          style={{
                            padding: 16,
                            border: '1px solid #e0e0e0',
                            fontSize: 14,
                            maxWidth: isSpecialColumn ? 600 : 400,
                            minWidth: isSpecialColumn ? 400 : 200,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            textAlign: 'center',
                            background: isSpecialColumn ? '#f8f9fa' : 'inherit',
                            verticalAlign: 'top',
                            lineHeight: '1.4',
                          }}
                        >
                          {isSpecialColumn && typeof displayVal === 'string'
                            ? displayVal.split('|').map((part, idx, arr) => (
                                <React.Fragment key={idx}>
                                  {part}
                                  {idx < arr.length - 1 && <br />}
                                </React.Fragment>
                              ))
                            : isSpecialColumn && displayVal && String(displayVal).includes('|')
                            ? String(displayVal).split('|').map((part, idx, arr) => (
                                <React.Fragment key={idx}>
                                  {part}
                                  {idx < arr.length - 1 && <br />}
                                </React.Fragment>
                              ))
                            : displayVal}
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
      <div className="pagamentos-header">
        <h1>💳 Pagamentos - Web / PIX (GMA)</h1>
        <p className="subtitle">Consulte transações de pagamentos via Web e PIX no sistema GMA</p>
      </div>
      
      <form onSubmit={handleSubmit} className="pagamentos-form">
        <div className="pagamentos-form-grid">
          <div className="pagamentos-form-field">
            <label>Data Inicial</label>
            <input 
              type="date" 
              name="dtStart" 
              value={filters.dtStart} 
              onChange={handleChange}
            />
            <span className="calendar-icon">📅</span>
          </div>
          
          <div className="pagamentos-form-field">
            <label>Data Final</label>
            <input 
              type="date" 
              name="dtEnd" 
              value={filters.dtEnd} 
              onChange={handleChange}
            />
            <span className="calendar-icon">📅</span>
          </div>
          
          <div className="pagamentos-form-field">
            <label>💰 Valor (R$)</label>
            <input 
              type="text" 
              name="amount" 
              value={filters.amount} 
              onChange={handleChange} 
              placeholder="Ex: 1350,00 ou 1350.00"
            />
          </div>
          
          <div className="pagamentos-form-field">
            <label>Card BIN</label>
            <input 
              type="text" 
              name="card_bin" 
              value={filters.card_bin} 
              onChange={handleChange} 
              maxLength={6} 
              placeholder="6 dígitos"
            />
          </div>
          
          <div className="pagamentos-form-field">
            <label>Card Last</label>
            <input 
              type="text" 
              name="card_last" 
              value={filters.card_last} 
              onChange={handleChange} 
              maxLength={4} 
              placeholder="4 dígitos"
            />
          </div>
          
          <div className="pagamentos-form-field">
            <label>Card Token</label>
            <input 
              type="text" 
              name="card_token" 
              value={filters.card_token} 
              onChange={handleChange}
            />
          </div>
          
          <div className="pagamentos-form-field">
            <label>Transaction ID</label>
            <input 
              type="text" 
              name="transaction_id" 
              value={filters.transaction_id} 
              onChange={handleChange}
            />
          </div>
          
          <div className="pagamentos-form-field">
            <label>Correlation ID</label>
            <input 
              type="text" 
              name="correlation_id" 
              value={filters.correlation_id} 
              onChange={handleChange}
            />
          </div>
          
          <div className="pagamentos-form-field">
            <label>Application Name</label>
            <input 
              type="text" 
              name="application_name" 
              value={filters.application_name} 
              onChange={handleChange}
            />
          </div>
          
          <div className="pagamentos-form-field">
            <label>Card Exp Date</label>
            <input 
              type="text" 
              name="card_exp_date" 
              value={filters.card_exp_date} 
              onChange={handleChange} 
              placeholder="MM/YYYY"
            />
          </div>
          
          <div className="pagamentos-form-field">
            <label>NSU</label>
            <input 
              type="text" 
              name="nsu" 
              value={filters.nsu} 
              onChange={handleChange} 
              placeholder="NSU"
            />
          </div>
          
          <div className="pagamentos-form-field">
            <label>Authorization Code</label>
            <input 
              type="text" 
              name="authorization_code" 
              value={filters.authorization_code} 
              onChange={handleChange} 
              placeholder="Authorization Code"
            />
          </div>
        </div>
        
        <div className="pagamentos-submit-container">
          <button type="submit" className="pagamentos-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Buscando...
              </>
            ) : (
              <>
                🔍 Buscar Pagamentos
              </>
            )}
          </button>
        </div>
      </form>
      {error && <div className="error">{error}</div>}
      {infoMessage && <div className="alert alert-info">{infoMessage}</div>}
      {results.length > 0 ? (
        <div className="pagamentos-results-container">
          <div className="pagamentos-results-header">
            <div className="pagamentos-results-info">
              <h2>📊 Resultados da Consulta</h2>
              <div className="pagamentos-results-stats">
                <div className="pagamentos-stat-item">
                  📋 <strong>{filteredResults.length}</strong> registro(s) encontrado(s)
                </div>
                {sortField && (
                  <div className="pagamentos-stat-item">
                    🔄 Ordenado por: <strong>{sortField.replace(/_/g, ' ').toUpperCase()}</strong> ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pagamentos-search-section">
            <div className="pagamentos-search-container">
              <span className="pagamentos-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar nos resultados..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pagamentos-search-input"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="pagamentos-search-clear"
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div className="pagamentos-table-container">
            <table className="pagamentos-table">
              <thead>
                <tr>
                  {Object.keys(results[0]).map(key => (
                    <th
                      key={key}
                      title={key}
                      onClick={() => handleSort(key)}
                    >
                      <div className="header-content">
                        <span>{key.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className={`sort-icon ${sortField === key ? 'active' : ''}`}>
                          {sortField === key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((row, i) => (
                  <tr key={i}>
                    {Object.entries(row).map(([key, val], j) => {
                      // Formatação de valores
                      let displayVal = formatValue(val, key);
                      // Truncar textos longos
                      const isLong = typeof displayVal === 'string' && displayVal.length > 32;
                      return (
                        <td key={j} title={isLong ? displayVal : undefined}>
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="pagamentos-no-results">
            <span className="icon">📋</span>
            <h3>Nenhum resultado encontrado</h3>
            <p>Tente ajustar os filtros de busca para encontrar transações.</p>
          </div>
        )
      )}
      {results.length === 0 && !loading && !error && (
        <div className="pagamentos-no-results" style={{ textAlign: 'center', color: '#bdbdbd', marginTop: 32, fontSize: 18 }}>
          <span className="icon">📋</span>
          <h3>Nenhum resultado encontrado</h3>
          <p>Tente ajustar os filtros de busca para encontrar transações.</p>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {infoMessage && <div className="alert alert-info">{infoMessage}</div>}
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

function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className="navbar-brand">
          <img src={bmbIcon} alt="Ícone BMB" className="navbar-logo" style={{height: 32, marginRight: 12}} />
          <span className="navbar-title" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.1}}>
            <span style={{fontWeight: 700}}>Portal de Consultas</span>
            <span style={{fontWeight: 400, fontSize: '1.1em'}}>Subadquirência</span>
          </span>
        </div>
        
        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
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
          </ul>
        </div>
        
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>✕</span>
          ) : (
            <span style={{ fontSize: '18px' }}>
              <div style={{ width: '20px', height: '2px', background: 'white', margin: '4px 0' }}></div>
              <div style={{ width: '20px', height: '2px', background: 'white', margin: '4px 0' }}></div>
              <div style={{ width: '20px', height: '2px', background: 'white', margin: '4px 0' }}></div>
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular verificação de autenticação
    setTimeout(() => {
      setUser({
        name: 'Usuário Teste',
        role: 'admin',
        permissions: ['home', 'antifraude', 'bolepix', 'cielo_gerar_token', 'cielo_solicitar_cancelamento', 'cielo_carta_cancelamento', 'cielo_cancelamento_pm', 'pagamentos_gma', 'pagamentos_posnegado']
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="app-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <h2>Carregando...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Router>
        <Navbar user={user} />
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
        </Routes>
      </Router>
    </div>
  );
}

export default App
