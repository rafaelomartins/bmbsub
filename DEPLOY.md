# 🚀 Deploy da Aplicação Portal SUB

## Opções de Deploy

### 1. 🟢 **Vercel (Recomendado - Gratuito)**

#### Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Repositório no GitHub

#### Configuração
1. **Conectar ao GitHub:**
   ```bash
   git add .
   git commit -m "Configuração para deploy Vercel"
   git push origin main
   ```

2. **Deploy no Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Conecte com GitHub
   - Selecione seu repositório
   - Configure as variáveis de ambiente

#### Variáveis de Ambiente no Vercel
Configure em **Settings > Environment Variables**:
```
DB_USER=rafa.oliveira
DB_HOST=bi-telco.connector.datalake.bemobi.com
DB_NAME=master
DB_PASSWORD=Inicio@1
DB_PORT=5439
NODE_ENV=production
```

### 2. 🟠 **Railway (Alternativa Gratuita)**

#### Deploy via CLI
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Criar projeto
railway create

# Deploy
railway up
```

### 3. 🟡 **Render (Gratuito com Limitações)**

#### Web Service
- Conectar repositório GitHub
- Build Command: `cd frontend && npm install && npm run build`
- Start Command: `cd backend && npm install && node index.js`

### 4. 🔵 **DigitalOcean App Platform**

#### Configuração
- Conectar GitHub
- Configurar como **Static Site + API**
- Frontend: React
- Backend: Node.js

### 5. 🟣 **Heroku (Pago)**

#### Deploy
```bash
# Instalar Heroku CLI
heroku create seu-app-name
heroku config:set DB_USER=rafa.oliveira
heroku config:set DB_HOST=bi-telco.connector.datalake.bemobi.com
# ... outras variáveis
git push heroku main
```

## 📋 Checklist de Deploy

### ✅ Antes do Deploy
- [ ] Código commitado no Git
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível
- [ ] Testes funcionando

### ✅ Após o Deploy
- [ ] Aplicação acessível
- [ ] Login funcionando
- [ ] Consultas BolePIX funcionando
- [ ] Antifraude funcionando
- [ ] Responsividade OK

## 🔧 Configurações Específicas

### Frontend (React)
```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build"
  }
}
```

### Backend (Node.js)
```javascript
// Configuração para produção
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
```

## 🌐 Domínio Personalizado

### Vercel
- Vá em **Settings > Domains**
- Adicione seu domínio
- Configure DNS

### Outros Provedores
- Cada provedor tem processo específico
- Geralmente em **Settings > Custom Domain**

## 🔒 Segurança

### Variáveis de Ambiente
**NUNCA** commit senhas ou chaves no código!

### HTTPS
Todos os provedores mencionados oferecem HTTPS automático.

### CORS
Já configurado para aceitar qualquer origem em desenvolvimento.

## 📊 Monitoramento

### Logs
- **Vercel**: Functions > Logs
- **Railway**: Deployment Logs
- **Render**: Logs tab

### Performance
- Use ferramentas como Google PageSpeed
- Monitore tempo de resposta das APIs

## 🆘 Troubleshooting

### Erro de Build
```bash
# Limpar cache
npm run build --force

# Verificar dependências
npm ci
```

### Erro de Conexão DB
- Verificar variáveis de ambiente
- Testar conexão local
- Verificar firewall do banco

### Timeout nas APIs
- Verificar se as APIs externas estão acessíveis
- Aumentar timeout se necessário

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do provedor
2. Testar localmente
3. Verificar configurações de rede
4. Consultar documentação do provedor 