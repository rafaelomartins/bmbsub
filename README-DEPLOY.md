# 🚀 Configuração Vercel - Portal SUB API

## ✅ Status da Configuração

**✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!**

### 📁 Arquivos Criados/Atualizados

1. **`vercel.json`** - Configuração principal do Vercel
2. **`package.json`** - Scripts otimizados para deploy
3. **`frontend/package.json`** - Configuração do frontend
4. **`backend/package.json`** - Configuração do backend
5. **`frontend/vite.config.js`** - Build otimizado para produção
6. **`.vercelignore`** - Arquivos ignorados no deploy
7. **`deploy.sh`** - Script automatizado de deploy
8. **`backend/env.example`** - Exemplo de variáveis de ambiente
9. **`GUIA-DEPLOY.md`** - Guia completo de deploy

### 🔧 Configurações Implementadas

#### Vercel Configuration
- ✅ Build do frontend (React + Vite)
- ✅ Build do backend (Node.js + Express)
- ✅ Roteamento automático (`/api/*` → backend, `/*` → frontend)
- ✅ Timeout de 30 segundos para APIs
- ✅ Região São Paulo (gru1)
- ✅ Tamanho máximo de 15MB para funções

#### Build Optimization
- ✅ Minificação com Terser
- ✅ Code splitting (vendor, router)
- ✅ Source maps desabilitados para produção
- ✅ Build otimizado para performance

#### Scripts Disponíveis
```bash
# Instalar todas as dependências
npm run install-deps

# Build do frontend
npm run build

# Build para Vercel
npm run vercel-build

# Deploy automatizado
./deploy.sh
```

## 🚀 Próximos Passos

### 1. Deploy via Interface Web (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub/GitLab/Bitbucket
3. Clique em "New Project"
4. Importe o repositório `API-Consultas`
5. Configure as variáveis de ambiente
6. Deploy!

### 2. Deploy via Terminal

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
./deploy.sh
```

### 3. Configurar Variáveis de Ambiente

No dashboard do Vercel, adicione:

```
DATABASE_URL=sua_url_do_banco
JWT_SECRET=seu_jwt_secret_super_seguro
CIELO_CLIENT_ID=seu_client_id
CIELO_CLIENT_SECRET=seu_client_secret
BOLETO_API_URL=https://api.boletopix.com
ANTIFRAUDE_API_URL=https://api.antifraude.com
NODE_ENV=production
```

## 📊 Testes Realizados

- ✅ Instalação de dependências
- ✅ Build local do frontend
- ✅ Configuração do Vite otimizada
- ✅ Scripts de deploy funcionando
- ✅ Estrutura de arquivos organizada

## 🔍 Verificação Pós-Deploy

1. **Frontend**: Acesse a URL do projeto
2. **Backend**: Teste `/api/health`
3. **APIs**: Teste login e consultas
4. **Logs**: Monitore com `vercel logs --prod`

## 🛠️ Troubleshooting

### Erro de Build
```bash
# Verificar logs
vercel logs

# Rebuild local
npm run build
```

### Erro de Dependências
```bash
# Limpar e reinstalar
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install-deps
```

### Erro de Variáveis
- Verificar se todas as variáveis estão configuradas no Vercel
- Testar localmente com arquivo `.env`

## 📞 Suporte

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Guia Completo**: `GUIA-DEPLOY.md`
- **Script de Deploy**: `./deploy.sh`

---

**🎉 Sua aplicação está pronta para deploy!**

Execute `./deploy.sh` ou use a interface web do Vercel para colocar sua aplicação no ar. 