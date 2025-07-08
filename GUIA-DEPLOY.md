# 🚀 Guia Completo de Deploy - Portal SUB API

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Node.js 18+ instalado
- Git configurado
- Projeto no GitHub/GitLab/Bitbucket

## 🔧 Configuração Inicial

### 1. Preparar o Projeto

```bash
# Instalar dependências
npm run install-deps

# Testar build local
npm run build
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` no backend com suas variáveis:

```env
# Banco de Dados
DATABASE_URL=sua_url_do_banco

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro

# APIs Externas
CIELO_CLIENT_ID=seu_client_id
CIELO_CLIENT_SECRET=seu_client_secret
BOLETO_API_URL=https://api.boletopix.com
ANTIFRAUDE_API_URL=https://api.antifraude.com

# Configurações
PORT=3001
NODE_ENV=production
```

## 🌐 Deploy via Interface Web (Recomendado)

### Passo 1: Acessar Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub/GitLab/Bitbucket
3. Clique em "New Project"

### Passo 2: Importar Repositório
1. Selecione seu repositório `API-Consultas`
2. Clique em "Import"

### Passo 3: Configurar Projeto
1. **Framework Preset**: `Other`
2. **Root Directory**: `./` (raiz do projeto)
3. **Build Command**: `npm run vercel-build`
4. **Output Directory**: `frontend/dist`
5. **Install Command**: `npm run install-deps`

### Passo 4: Configurar Variáveis de Ambiente
Na seção "Environment Variables", adicione:

```
DATABASE_URL=sua_url_do_banco
JWT_SECRET=seu_jwt_secret_super_seguro
CIELO_CLIENT_ID=seu_client_id
CIELO_CLIENT_SECRET=seu_client_secret
BOLETO_API_URL=https://api.boletopix.com
ANTIFRAUDE_API_URL=https://api.antifraude.com
NODE_ENV=production
```

### Passo 5: Deploy
1. Clique em "Deploy"
2. Aguarde o build (2-3 minutos)
3. Acesse sua URL: `https://seu-projeto.vercel.app`

## 💻 Deploy via Terminal

### Instalar Vercel CLI
```bash
npm i -g vercel
```

### Login no Vercel
```bash
vercel login
```

### Deploy
```bash
# Deploy inicial
vercel

# Deploy para produção
vercel --prod
```

## 🔍 Verificação do Deploy

### 1. Testar Frontend
- Acesse a URL do projeto
- Verifique se o login carrega
- Teste a navegação

### 2. Testar Backend
- Acesse: `https://seu-projeto.vercel.app/api/health`
- Deve retornar status 200

### 3. Testar APIs
```bash
# Teste de login
curl -X POST https://seu-projeto.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Teste de consulta
curl -X POST https://seu-projeto.vercel.app/api/consultas/boletopix \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"correlationId":"123456"}'
```

## 🛠️ Troubleshooting

### Erro de Build
```bash
# Verificar logs
vercel logs

# Rebuild local
npm run build
```

### Erro de CORS
- Verificar se o backend está configurado corretamente
- Checar se as rotas `/api/*` estão funcionando

### Erro de Variáveis de Ambiente
- Verificar se todas as variáveis estão configuradas no Vercel
- Testar localmente com `.env`

### Erro de Timeout
- Verificar se as APIs externas estão acessíveis
- Aumentar timeout no `vercel.json` se necessário

## 📊 Monitoramento

### Vercel Analytics
- Acesse o dashboard do projeto
- Monitore performance e erros
- Configure alertas

### Logs
```bash
# Ver logs em tempo real
vercel logs --follow

# Ver logs de produção
vercel logs --prod
```

## 🔄 Atualizações

### Deploy Automático
- Push para `main` = deploy automático
- Push para outras branches = preview deploy

### Deploy Manual
```bash
# Deploy específico
vercel --prod

# Rollback
vercel rollback
```

## 🔒 Segurança

### Variáveis Sensíveis
- Nunca commitar `.env` no Git
- Usar variáveis de ambiente do Vercel
- Rotacionar secrets regularmente

### HTTPS
- Vercel fornece HTTPS automaticamente
- Certificados SSL gerenciados

## 📱 Domínio Customizado

1. Acesse o dashboard do projeto
2. Vá em "Settings" > "Domains"
3. Adicione seu domínio
4. Configure DNS conforme instruções

## 🎯 Próximos Passos

1. ✅ Configurar monitoramento
2. ✅ Implementar CI/CD
3. ✅ Configurar backup do banco
4. ✅ Implementar rate limiting
5. ✅ Configurar CDN

---

**🎉 Parabéns! Sua aplicação está no ar!**

Para suporte: [Vercel Docs](https://vercel.com/docs) 