const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'bemobi-secret-key-2024';

// Permissões disponíveis no sistema
const PERMISSIONS = {
  HOME: 'home',
  ANTIFRAUDE: 'antifraude',
  BOLEPIX: 'bolepix',
  CIELO_GERAR_TOKEN: 'cielo_gerar_token',
  CIELO_SOLICITAR_CANCELAMENTO: 'cielo_solicitar_cancelamento',
  CIELO_CARTA_CANCELAMENTO: 'cielo_carta_cancelamento',
  CIELO_CANCELAMENTO_PM: 'cielo_cancelamento_pm',
  PAGAMENTOS_GMA: 'pagamentos_gma',
  PAGAMENTOS_POSNEGADO: 'pagamentos_posnegado'
};

// Usuários mockados (em produção, usar banco de dados)
const users = [
  {
    id: 1,
    email: 'rafael.oliveira@bemobi.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Rafael Oliveira',
    role: 'admin',
    permissions: Object.values(PERMISSIONS) // Admin tem todas as permissões
  },
  {
    id: 2,
    email: 'admin@bemobi.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Administrador',
    role: 'admin',
    permissions: Object.values(PERMISSIONS) // Admin tem todas as permissões
  }
];

// Função para validar domínio de email
const validateBemobiEmail = (email) => {
  const emailRegex = /^[^\s@]+@bemobi\.com$/;
  return emailRegex.test(email);
};

// Função para gerar hash da senha
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Função para verificar senha
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Função para gerar JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      permissions: user.permissions || []
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
};

// Função para verificar JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }

  req.user = user;
  next();
};

// Função de login
const login = async (email, password) => {
  // Validar domínio de email
  if (!validateBemobiEmail(email)) {
    throw new Error('Apenas emails @bemobi.com são permitidos');
  }

  // Buscar usuário
  const user = users.find(u => u.email === email);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // Verificar senha
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    throw new Error('Senha incorreta');
  }

  // Gerar token
  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions || []
    }
  };
};





module.exports = {
  login,
  authenticateToken,
  validateBemobiEmail,
  generateToken,
  verifyToken,
  users,
  PERMISSIONS
}; 