# 🏦 Portal de Consultas Bemobi

Portal web interno para consultas e operações relacionadas a pagamentos, antifraude, integração Cielo e diagnósticos financeiros da Bemobi.

## 🔐 Sistema de Autenticação

O portal possui sistema de autenticação privado com as seguintes características:

- **Acesso Restrito**: Apenas usuários com email @bemobi.com
- **Login Seguro**: Autenticação com JWT (JSON Web Token)
- **Validação de Domínio**: Verificação automática de emails @bemobi.com
- **Sessões**: Tokens válidos por 8 horas
- **Logout**: Encerramento seguro de sessões

### Credenciais de Teste
- **Email**: rafael.oliveira@bemobi.com
- **Senha**: password
- **Tipo**: Administrador

## 🚀 Funcionalidades

### 📊 Consultas Antifraude
- Busca por documento em múltiplas bases de dados
- Filtros dinâmicos e ordenação por colunas
- Exportação de resultados para CSV
- Interface moderna e responsiva

### 💳 Pagamentos GMA (Web/PIX)
- Consulta detalhada de transações
- Filtros avançados: datas, valores, cartão, NSU, autorização
- Busca em tempo real nos resultados
- Tabela com ordenação e paginação

### 🏪 Pagamento POS Negado
- Consulta transações negadas no POS
- Filtros por data, valor, BIN/PAN, NSU, autorização
- Interface unificada com demais módulos

### 🏦 Integração Cielo
- **Geração de Token**: Interface para gerar tokens de acesso
- **Solicitar Cancelamento**: Cancelamento de transações
- **Carta de Cancelamento**: Geração de cartas
- **Cancelamento PM**: Cancelamento via Payment Management

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React** - Framework principal
- **Vite** - Build tool e dev server
- **React Router** - Gerenciamento de rotas
- **CSS Customizado** - Estilização responsiva

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Banco de dados
- **Axios** - Cliente HTTP para APIs externas

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Acesso ao banco PostgreSQL da Bemobi

### Passos para Instalação

1. **Clone o repositório**
```bash
git clone [URL_DO_REPOSITORIO]
cd API-Consultas
```

2. **Instale as dependências do Backend**
```bash
cd backend
npm install
```

3. **Instale as dependências do Frontend**
```bash
cd ../frontend
npm install
```

4. **Configure as variáveis de ambiente** (opcional)
```bash
# No diretório backend, crie um arquivo .env
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

5. **Execute o Backend**
```bash
cd backend
node index.js
```

6. **Execute o Frontend**
```bash
cd frontend
npm run dev
```

7. **Acesse a aplicação**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🗂️ Estrutura do Projeto

```
API-Consultas/
├── backend/
│   ├── index.js              # Servidor principal
│   ├── package.json          # Dependências do backend
│   └── test-db.js           # Scripts de diagnóstico
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Componente principal
│   │   ├── App.css          # Estilos globais
│   │   └── main.jsx         # Ponto de entrada
│   ├── package.json         # Dependências do frontend
│   └── vite.config.js       # Configuração do Vite
├── README.md                # Este arquivo
└── .gitignore              # Arquivos ignorados pelo Git
```

## 🔧 Configuração do Banco de Dados

O projeto utiliza as seguintes tabelas:
- `refined_payments.payment_management` - Dados de pagamentos
- `refined_payments.gma_transactions` - Transações GMA
- `refined_payments.eldorado_card` - Dados de cartões
- `refined_service_prevention.*` - Tabelas de antifraude

### Conexão com Banco
```javascript
const pool = new Pool({
  user: 'rafa.oliveira',
  host: 'bi-telco.connector.datalake.bemobi.com',
  database: 'master',
  password: 'Inicio@1',
  port: 5439,
  ssl: { rejectUnauthorized: false }
});
```

## 🚀 Deploy

### Desenvolvimento Local
```bash
# Terminal 1 - Backend
cd backend && node index.js

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Produção (Recomendações)
1. **Variáveis de Ambiente**: Use `.env` para credenciais
2. **Process Manager**: PM2 para Node.js
3. **Reverse Proxy**: Nginx para servir o frontend
4. **SSL**: Certificado HTTPS para produção

## 📋 Scripts Disponíveis

### Backend
```bash
cd backend
node index.js                    # Iniciar servidor
node test-db.js                  # Testar conexão com banco
node test-pos-negado.js          # Testar consultas POS
```

### Frontend
```bash
cd frontend
npm run dev                      # Servidor de desenvolvimento
npm run build                    # Build para produção
npm run preview                  # Preview do build
```

## 🔍 Diagnóstico e Troubleshooting

### Testar Conexão com Banco
```bash
cd backend
node test-db.js
```

### Verificar Estrutura das Tabelas
O script `test-db.js` lista:
- Tabelas disponíveis
- Estrutura das colunas
- Range de datas
- Exemplos de dados

### Logs do Backend
O servidor exibe logs detalhados para:
- Consultas realizadas
- Parâmetros recebidos
- Erros de conexão
- Resultados encontrados

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é de uso interno da Bemobi.

## 👥 Equipe

- **Desenvolvedor**: Rafael Oliveira
- **Empresa**: Bemobi
- **Departamento**: TI/Desenvolvimento

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do backend
2. Execute os scripts de diagnóstico
3. Consulte a documentação das APIs externas
4. Entre em contato com a equipe de desenvolvimento

---

**Versão**: 1.0.0  
**Última Atualização**: Dezembro 2024
