import { useState, useEffect } from 'react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
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

  useEffect(() => {
    fetchUsers();
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
    <div style={{ padding: '32px 0', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px' 
      }}>
        <h1 style={{ color: '#1976d2', margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: 1 }}>Gerenciamento de Usuários</h1>
        <div>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              background: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '10px',
              fontWeight: 600,
              fontSize: 16,
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)'
            }}
          >
            + Adicionar Usuário
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '14px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #ffcdd2',
          fontSize: 15
        }}>
          {error}
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
                <th style={{ padding: '16px 12px', textAlign: 'left', borderBottom: '2px solid #e3e3e3', fontWeight: 700, color: '#1976d2', background: '#f5f7fa', position: 'sticky', top: 0 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0', background: user.role === 'admin' ? '#f7faff' : 'white' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 500 }}>{user.id}</td>
                  <td style={{ padding: '14px 12px', fontWeight: 500 }}>{user.name}</td>
                  <td style={{ padding: '14px 12px', fontWeight: 500 }}>{user.email}</td>
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
    </div>
  );
}

export default UserManagement; 