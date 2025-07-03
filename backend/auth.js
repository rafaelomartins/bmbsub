const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'bemobi-secret-key-2024';

// Usuários mockados (em produção, usar banco de dados)
const users = [
  {
    id: 1,
    email: 'rafael.oliveira@bemobi.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Rafael Oliveira',
    role: 'admin'
  },
  {
    id: 2,
    email: 'admin@bemobi.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Administrador',
    role: 'admin'
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
      role: user.role 
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
      role: user.role
    }
  };
};

// Função para registrar novo usuário (apenas admin)
const registerUser = async (email, password, name, role = 'user') => {
  // Validar domínio de email
  if (!validateBemobiEmail(email)) {
    throw new Error('Apenas emails @bemobi.com são permitidos');
  }

  // Verificar se usuário já existe
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    throw new Error('Usuário já existe');
  }

  // Hash da senha
  const hashedPassword = await hashPassword(password);

  // Criar novo usuário
  const newUser = {
    id: users.length + 1,
    email,
    password: hashedPassword,
    name,
    role
  };

  users.push(newUser);

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role
  };
};

module.exports = {
  login,
  registerUser,
  authenticateToken,
  validateBemobiEmail,
  generateToken,
  verifyToken,
  users
}; 