import { useState, useEffect } from 'react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showPermissionsForm, setShowPermissionsForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availablePermissions, setAvailablePermissions] = useState({});
  
  // Estados para o formulário de adicionar usuário
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user'
  });

  // Estados para o formulário de redefinir senha
  const [resetPassword, setResetPassword] = useState({
    userId: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estados para o formulário de permissões
  const [userPermissions, setUserPermissions] = useState([]);

  // Buscar todos os usuários
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Buscar permissões disponíveis
  const fetchAvailablePermissions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('API de permissões falhou, usando fallback');
        return; // Usar o fallback já definido no useEffect
      }

      const data = await response.json();
      console.log('Permissões recebidas da API:', data.permissions);
      
      if (data.permissions && Object.keys(data.permissions).length > 0) {
        setAvailablePermissions(data.permissions);
      }
    } catch (err) {
      console.error('Erro ao buscar permissões da API:', err);
      // Mantém o fallback já definido no useEffect
    }
  };

  useEffect(() => {
    // Inicializar permissões com fallback garantido
    setAvailablePermissions({
      'home': 'Principal',
      'antifraude': 'Consultas de Prevenção',
      'bolepix': 'Consulta BolePIX AE',
      'cielo_gerar_token': 'Cielo - Gerar Token',
      'cielo_solicitar_cancelamento': 'Cielo - Solicitar Cancelamento',
      'cielo_carta_cancelamento': 'Cielo - Carta de Cancelamento',
      'cielo_cancelamento_pm': 'Cielo - Cancelamento PM',
      'pagamentos_gma': 'Pagamentos - Web PIX (GMA)',
      'pagamentos_posnegado': 'Pagamentos - POS Negado',
      'usuarios': 'Gerenciar Usuários'
    });
    
    fetchUsers();
    fetchAvailablePermissions();
  }, []);

  // Adicionar novo usuário
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (newUser.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar usuário');
      }

      // Limpar formulário e recarregar usuários
      setNewUser({ email: '', password: '', name: '', role: 'user' });
      setShowAddForm(false);
      setError('');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Redefinir senha
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (resetPassword.newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: resetPassword.userId,
          newPassword: resetPassword.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }

      // Limpar formulário
      setResetPassword({ userId: '', newPassword: '', confirmPassword: '' });
      setShowResetForm(false);
      setSelectedUser(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Atualizar permissões do usuário
  const handleUpdatePermissions = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/auth/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: userPermissions })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar permissões');
      }

      // Limpar formulário
      setUserPermissions([]);
      setShowPermissionsForm(false);
      setSelectedUser(null);
      setError('');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Deletar usuário
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar usuário');
      }

      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="bolepix-card">
      <div className="page-header">
        <h1>👥 Gerenciamento de Usuários</h1>
        <p className="subtitle">Administração de contas, permissões e controle de acesso ao sistema</p>
      </div>

      {error && (
        <div className="modern-alert error">
          <span className="alert-icon">❌</span>
          <div className="alert-content">
            <div className="alert-title">Erro</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        overflow: 'hidden',
        marginBottom: 40
      }}>
        <div style={{ overflowX: 'auto', maxHeight: 420 }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 600,
            fontSize: 15
          }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f5f7fa' }}>
              <tr>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #e3e3e3', fontWeight: 700, color: '#1976d2', background: '#f5f7fa', position: 'sticky', top: 0 }}>ID</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #e3e3e3', fontWeight: 700, color: '#1976d2', background: '#f5f7fa', position: 'sticky', top: 0 }}>Nome</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #e3e3e3', fontWeight: 700, color: '#1976d2', background: '#f5f7fa', position: 'sticky', top: 0 }}>Email</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #e3e3e3', fontWeight: 700, color: '#1976d2', background: '#f5f7fa', position: 'sticky', top: 0 }}>Função</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #e3e3e3', fontWeight: 700, color: '#1976d2', background: '#f5f7fa', position: 'sticky', top: 0 }}>Permissões</th>
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #e3e3e3', fontWeight: 700, color: '#1976d2', background: '#f5f7fa', position: 'sticky', top: 0 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0', background: user.role === 'admin' ? '#f7faff' : 'white' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 500, color: '#333' }}>{user.id}</td>
                  <td style={{ padding: '14px 12px', fontWeight: 500, color: '#333' }}>{user.name}</td>
                  <td style={{ padding: '14px 12px', fontWeight: 500, color: '#333' }}>{user.email}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{
                      background: user.role === 'admin' ? '#ff9800' : '#1976d2',
                      color: 'white',
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      letterSpacing: 1
                    }}>
                      {user.role === 'admin' ? 'ADMIN' : 'USER'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px', color: '#333' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {user.role === 'admin' ? 'Todas' : `${user.permissions ? user.permissions.length : 0} permissões`}
                      </span>
                      {user.role !== 'admin' && (
                        <button
                          title="Gerenciar permissões"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserPermissions(user.permissions || []);
                            setShowPermissionsForm(true);
                          }}
                          style={{
                            background: '#4caf50',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          ⚙️
                        </button>
                      )}
                      {user.role === 'admin' && (
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#ff9800',
                          fontWeight: 600,
                          background: 'rgba(255, 152, 0, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '3px'
                        }}>
                          FIXO
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <button
                      title="Redefinir senha"
                      onClick={() => {
                        setSelectedUser(user);
                        setResetPassword({ ...resetPassword, userId: user.id });
                        setShowResetForm(true);
                      }}
                      style={{
                        background: '#ff9800',
                        color: 'white',
                        border: 'none',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '8px',
                        fontSize: '15px',
                        fontWeight: 600,
                        boxShadow: '0 1px 4px rgba(255,152,0,0.08)'
                      }}
                    >
                      🔑
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        title="Excluir usuário"
                        onClick={() => handleDeleteUser(user.id)}
                        style={{
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '15px',
                          fontWeight: 600,
                          boxShadow: '0 1px 4px rgba(244,67,54,0.08)'
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botão Adicionar Usuário */}
      <div className="btn-container" style={{ marginTop: '24px', marginBottom: '32px' }}>
        <button
          onClick={() => setShowAddForm(true)}
          className="modern-btn"
        >
          👤 Adicionar Usuário
        </button>
      </div>

      {/* Modal Adicionar Usuário */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '36px 32px',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 4px 24px rgba(25, 118, 210, 0.13)'
          }}>
            <h2 style={{ marginTop: 0, color: '#1976d2', fontWeight: 700, fontSize: 22 }}>Adicionar Novo Usuário</h2>
            
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontSize: 15
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                  Email @bemobi.com *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontSize: 15
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                  Senha *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontSize: 15
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                  Função *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontSize: 15
                  }}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    padding: '10px 22px',
                    border: '1px solid #ddd',
                    background: 'white',
                    color: '#333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    background: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha */}
      {showResetForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '36px 32px',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 4px 24px rgba(255,152,0,0.13)'
          }}>
            <h2 style={{ marginTop: 0, color: '#ff9800', fontWeight: 700, fontSize: 22 }}>Redefinir Senha</h2>
            
            {selectedUser && (
              <p style={{ color: '#666', marginBottom: '20px', fontWeight: 500 }}>
                Redefinindo senha para: <strong>{selectedUser.name}</strong> ({selectedUser.email})
              </p>
            )}
            
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                  Nova Senha *
                </label>
                <input
                  type="password"
                  value={resetPassword.newPassword}
                  onChange={(e) => setResetPassword({ ...resetPassword, newPassword: e.target.value })}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontSize: 15
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  value={resetPassword.confirmPassword}
                  onChange={(e) => setResetPassword({ ...resetPassword, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    fontSize: 15
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setSelectedUser(null);
                    setResetPassword({ userId: '', newPassword: '', confirmPassword: '' });
                  }}
                  style={{
                    padding: '10px 22px',
                    border: '1px solid #ddd',
                    background: 'white',
                    color: '#333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    background: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Redefinir Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Permissões */}
      {showPermissionsForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '36px 32px',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '600px',
            boxShadow: '0 4px 24px rgba(76, 175, 80, 0.13)',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0, color: '#4caf50', fontWeight: 700, fontSize: 22 }}>Gerenciar Permissões</h2>
            
            {selectedUser && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                  Configurando permissões para: <strong>{selectedUser.name}</strong> ({selectedUser.email})
                </p>
                {selectedUser.role === 'admin' && (
                  <div style={{ 
                    background: '#fff3cd', 
                    color: '#856404', 
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #ffeaa7',
                    fontSize: '14px'
                  }}>
                    ⚠️ Usuários administradores possuem todas as permissões automaticamente e não podem ser alteradas.
                  </div>
                )}
              </div>
            )}
            
            <form onSubmit={handleUpdatePermissions}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#333' }}>
                  {selectedUser?.role === 'admin' ? 'Permissões (Não Editável):' : 'Selecione as Permissões:'}
                </label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: selectedUser?.role === 'admin' ? '#f9f9f9' : 'white'
                }}>
                  {Object.keys(availablePermissions).length === 0 ? (
                    <div style={{ 
                      gridColumn: '1 / -1',
                      textAlign: 'center', 
                      color: '#666', 
                      padding: '20px',
                      fontStyle: 'italic'
                    }}>
                      Carregando permissões...
                    </div>
                  ) : (
                    Object.entries(availablePermissions).map(([key, label]) => (
                      <label key={key} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: selectedUser?.role === 'admin' ? 'not-allowed' : 'pointer',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: (selectedUser?.role === 'admin' || userPermissions.includes(key)) ? '#e8f5e8' : 'transparent',
                        border: (selectedUser?.role === 'admin' || userPermissions.includes(key)) ? '1px solid #4caf50' : '1px solid transparent',
                        opacity: selectedUser?.role === 'admin' ? 0.7 : 1
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedUser?.role === 'admin' ? true : userPermissions.includes(key)}
                          disabled={selectedUser?.role === 'admin'}
                          onChange={(e) => {
                            if (selectedUser?.role !== 'admin') {
                              if (e.target.checked) {
                                setUserPermissions([...userPermissions, key]);
                              } else {
                                setUserPermissions(userPermissions.filter(p => p !== key));
                              }
                            }
                          }}
                          style={{ 
                            width: '18px', 
                            height: '18px',
                            accentColor: '#4caf50'
                          }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{label}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                justifyContent: 'space-between',
                marginTop: '24px'
              }}>
                {selectedUser?.role !== 'admin' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setUserPermissions(Object.keys(availablePermissions))}
                      style={{
                        padding: '8px 16px',
                        background: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      Selecionar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserPermissions([])}
                      style={{
                        padding: '8px 16px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      Limpar Todas
                    </button>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '10px', marginLeft: selectedUser?.role === 'admin' ? '0' : 'auto' }}>
                                  <button
                  type="button"
                  onClick={() => {
                    setShowPermissionsForm(false);
                    setSelectedUser(null);
                    setUserPermissions([]);
                  }}
                  style={{
                    padding: '10px 22px',
                    border: '1px solid #ddd',
                    background: 'white',
                    color: '#333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {selectedUser?.role === 'admin' ? 'Fechar' : 'Cancelar'}
                </button>
                  {selectedUser?.role !== 'admin' && (
                    <button
                      type="submit"
                      style={{
                        padding: '10px 22px',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Salvar Permissões
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement; 